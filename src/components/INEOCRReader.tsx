import React, { useEffect, useRef, useState } from "react";
import Tesseract from 'tesseract.js';

interface INEDataOCR {
  nombre: string;
  apellidoPaterno: string;
  rawText: string;
}

type FlowStep = 'capture' | 'validated';

export default function INEOCRReader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ineData, setIneData] = useState<INEDataOCR | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  useEffect(() => {
    if (flowStep === 'capture') {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: orientation === 'horizontal' ? 1920 : 1080 },
          height: { ideal: orientation === 'horizontal' ? 1080 : 1920 }
        }
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(async (mediaStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
            
            // Aplicar zoom si está disponible
            try {
              const track = mediaStream.getVideoTracks()[0];
              const capabilities: any = track.getCapabilities();
              
              if (capabilities.zoom) {
                await track.applyConstraints({
                  advanced: [{ zoom: zoomLevel } as any]
                });
              }
            } catch (error) {
              console.log("Zoom no soportado en este dispositivo");
            }
            
            setDebugLog(prev => [...prev, "📷 Cámara iniciada (zoom: " + zoomLevel + "x)"]);
          }
        })
        .catch(error => {
          setDebugLog(prev => [...prev, "ERROR CAMARA: " + error.message]);
        });
    } else {
      // Detener cámara cuando no estamos en paso de captura
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [flowStep, zoomLevel, orientation]);

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setDebugLog(prev => [...prev, "📸 Capturando imagen..."]);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Configurar canvas con mejor resolución, respetando orientación
    if (orientation === 'vertical') {
      // Rotar canvas para vertical
      canvas.width = video.videoHeight;
      canvas.height = video.videoWidth;
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Dibujar la imagen del video con rotación si es necesario
    if (orientation === 'vertical') {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(90 * Math.PI / 180);
      ctx.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2, video.videoWidth, video.videoHeight);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    // Mejorar el contraste y brillo de la imagen
    setDebugLog(prev => [...prev, "🎨 Mejorando calidad de imagen..."]);
    const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageDataObj.data;
    
    // Aumentar contraste
    const factor = 1.5;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * factor);     // R
      data[i + 1] = Math.min(255, data[i + 1] * factor); // G
      data[i + 2] = Math.min(255, data[i + 2] * factor); // B
    }
    ctx.putImageData(imageDataObj, 0, 0);
    
    const imageData = canvas.toDataURL('image/png', 1.0);
    setCapturedImage(imageData); // Guardar imagen para mostrar
    
    setDebugLog(prev => [...prev, "🔍 Procesando con OCR (esto puede tardar)..."]);

    try {
      const result = await Tesseract.recognize(imageData, 'spa', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            if (progress % 20 === 0) { // Mostrar cada 20%
              setDebugLog(prev => [...prev, `⏳ OCR progreso: ${progress}%`]);
            }
          }
        }
      });

      const text = result.data.text;
      setDebugLog(prev => [...prev, "📝 Texto detectado (" + text.length + " caracteres)"]);
      setDebugLog(prev => [...prev, "🔎 Analizando datos..."]);
      console.log("========== TEXTO COMPLETO OCR ==========");
      console.log(text);
      console.log("========================================");

      const parsed = parseINEFromOCR(text);
      if (parsed && (parsed.apellidoPaterno || parsed.nombre)) {
        setIneData(parsed);
        setDebugLog(prev => [...prev, "✅ INE válida: " + parsed.apellidoPaterno + " " + parsed.nombre]);
        setFlowStep('validated');
      } else {
        setDebugLog(prev => [...prev, "❌ No se detectó nombre. Intenta con mejor iluminación."]);
      }
    } catch (error: any) {
      setDebugLog(prev => [...prev, "❌ ERROR OCR: " + error.message]);
    }

    setIsProcessing(false);
  };

  const parseINEFromOCR = (text: string): INEDataOCR | null => {
    try {
      console.log("========== INICIANDO PARSEO ==========");
      console.log("Texto original:", text);
      
      // Dividir en líneas preservando espacios
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      console.log("Total de líneas:", lines.length);
      lines.forEach((line, idx) => console.log(`Línea ${idx}: "${line}"`));
      
      let apellidoPaterno = '';
      let nombre = '';
      
      // ESTRATEGIA 1: Buscar líneas que son solo letras mayúsculas y espacios (nombres típicos en INE)
      console.log("\n--- ESTRATEGIA 1: Líneas en mayúsculas ---");
      const nameLines = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Debe ser principalmente letras mayúsculas, puede tener espacios
        const uppercaseRatio = (line.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length / line.length;
        if (uppercaseRatio > 0.7 && line.length >= 3 && line.length <= 40) {
          nameLines.push(line);
          console.log(`✓ Candidato ${nameLines.length}: "${line}" (ratio: ${uppercaseRatio.toFixed(2)})`);
        }
      }
      
      if (nameLines.length >= 2) {
        apellidoPaterno = nameLines[0];
        nombre = nameLines[1];
        console.log(`✅ ESTRATEGIA 1 EXITOSA - Apellido: "${apellidoPaterno}", Nombre: "${nombre}"`);
      }
      
      // ESTRATEGIA 2: Buscar palabras clave específicas de INE
      if (!apellidoPaterno || !nombre) {
        console.log("\n--- ESTRATEGIA 2: Palabras clave ---");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toUpperCase();
          
          // Buscar línea que contenga "APELLIDO" seguida de la siguiente línea
          if (line.includes('APELLIDO') && i + 1 < lines.length) {
            // La siguiente línea debería ser el apellido
            const nextLine = lines[i + 1].trim();
            if (nextLine.match(/^[A-ZÁÉÍÓÚÑ\s]{3,30}$/)) {
              apellidoPaterno = nextLine;
              console.log(`✓ Apellido encontrado después de "APELLIDO": "${apellidoPaterno}"`);
            }
          }
          
          // Buscar línea que contenga "NOMBRE" seguida de la siguiente línea
          if (line.includes('NOMBRE') && !line.includes('APELLIDO') && i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine.match(/^[A-ZÁÉÍÓÚÑ\s]{2,30}$/)) {
              nombre = nextLine;
              console.log(`✓ Nombre encontrado después de "NOMBRE": "${nombre}"`);
            }
          }
        }
        
        if (apellidoPaterno && nombre) {
          console.log(`✅ ESTRATEGIA 2 EXITOSA - Apellido: "${apellidoPaterno}", Nombre: "${nombre}"`);
        }
      }
      
      // ESTRATEGIA 3: Extraer palabras en mayúsculas del texto completo
      if (!apellidoPaterno || !nombre) {
        console.log("\n--- ESTRATEGIA 3: Palabras en mayúsculas ---");
        const allText = lines.join(' ');
        const words = allText.match(/[A-ZÁÉÍÓÚÑ]{3,}/g) || [];
        console.log("Palabras en mayúsculas encontradas:", words);
        
        if (words.length >= 2) {
          // Filtrar palabras comunes que no son nombres
          const commonWords = ['INSTITUTO', 'NACIONAL', 'ELECTORAL', 'MEXICO', 'ESTADOS', 'UNIDOS', 'MEXICANOS', 'CREDENCIAL', 'VOTAR', 'PARA'];
          const nameWords = words.filter(w => !commonWords.includes(w) && w.length >= 3);
          console.log("Palabras filtradas:", nameWords);
          
          if (nameWords.length >= 2) {
            apellidoPaterno = nameWords[0];
            nombre = nameWords.slice(1, Math.min(4, nameWords.length)).join(' ');
            console.log(`✅ ESTRATEGIA 3 EXITOSA - Apellido: "${apellidoPaterno}", Nombre: "${nombre}"`);
          }
        }
      }
      
      // ESTRATEGIA 4: Tomar las primeras líneas no vacías
      if (!apellidoPaterno || !nombre) {
        console.log("\n--- ESTRATEGIA 4: Primeras líneas ---");
        const validLines = lines.filter(l => l.length >= 3 && l.length <= 40);
        if (validLines.length >= 2) {
          apellidoPaterno = validLines[0];
          nombre = validLines[1];
          console.log(`✅ ESTRATEGIA 4 (respaldo) - Apellido: "${apellidoPaterno}", Nombre: "${nombre}"`);
        }
      }

      // Validar resultado
      if (!apellidoPaterno && !nombre) {
        console.log("❌ FALLO: No se pudo extraer ningún dato");
        return null;
      }

      const result = {
        apellidoPaterno: apellidoPaterno || 'NO DETECTADO',
        nombre: nombre || 'NO DETECTADO',
        rawText: text
      };
      
      console.log("\n========== RESULTADO FINAL ==========");
      console.log("Apellido Paterno:", result.apellidoPaterno);
      console.log("Nombre(s):", result.nombre);
      console.log("=====================================\n");
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en parseo OCR:', error);
      return null;
    }
  };

  const resetReader = () => {
    setIneData(null);
    setFlowStep('capture');
    setCapturedImage(null);
    setDebugLog((prev) => [...prev, "Reiniciando..."]);
  };

  return (
    <div style={{ textAlign: "center", padding: "10px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", minHeight: "100vh" }}>
      <h2 style={{ color: "white", paddingTop: "20px" }}>Validación de Acceso con INE - NUEVA VERSIÓN</h2>

      {/* PASO 1: CAPTURA DE CREDENCIAL */}
      {flowStep === 'capture' && (
        <>
          <p style={{ fontSize: "0.9em", color: "white" }}>
            Coloca la parte FRONTAL de la credencial INE frente a la cámara
          </p>

          {/* Controles de orientación */}
          <div style={{ 
            display: "flex", 
            gap: "10px", 
            justifyContent: "center", 
            marginBottom: "15px" 
          }}>
            <button
              onClick={() => setOrientation('horizontal')}
              style={{
                padding: "8px 15px",
                fontSize: "0.9em",
                borderRadius: "6px",
                border: "2px solid white",
                background: orientation === 'horizontal' ? "white" : "transparent",
                color: orientation === 'horizontal' ? "#667eea" : "white",
                cursor: "pointer",
                fontWeight: "bold"
              }}>
              📱 Horizontal
            </button>
            <button
              onClick={() => setOrientation('vertical')}
              style={{
                padding: "8px 15px",
                fontSize: "0.9em",
                borderRadius: "6px",
                border: "2px solid white",
                background: orientation === 'vertical' ? "white" : "transparent",
                color: orientation === 'vertical' ? "#667eea" : "white",
                cursor: "pointer",
                fontWeight: "bold"
              }}>
              📱 Vertical
            </button>
          </div>

          <video ref={videoRef} autoPlay muted playsInline 
            style={{ 
              width: "90%", 
              maxWidth: 600, 
              border: "2px solid #333", 
              borderRadius: "8px", 
              marginBottom: "15px",
              transform: orientation === 'vertical' ? 'rotate(90deg)' : 'none'
            }} />

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Controles de Zoom */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "15px", 
            marginBottom: "15px",
            background: "rgba(255,255,255,0.2)",
            padding: "15px",
            borderRadius: "10px",
            maxWidth: "500px",
            margin: "0 auto 15px auto"
          }}>
            <span style={{ color: "white", fontWeight: "bold", fontSize: "0.9em" }}>🔍 Zoom:</span>
            <button
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
              disabled={zoomLevel <= 1}
              style={{
                padding: "8px 15px",
                fontSize: "1.2em",
                borderRadius: "6px",
                border: "none",
                background: zoomLevel <= 1 ? "#555" : "white",
                color: zoomLevel <= 1 ? "#999" : "#667eea",
                cursor: zoomLevel <= 1 ? "not-allowed" : "pointer",
                fontWeight: "bold"
              }}>
              -
            </button>
            <span style={{ 
              color: "white", 
              fontWeight: "bold", 
              fontSize: "1.1em",
              minWidth: "50px",
              textAlign: "center"
            }}>
              {zoomLevel.toFixed(1)}x
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.5))}
              disabled={zoomLevel >= 5}
              style={{
                padding: "8px 15px",
                fontSize: "1.2em",
                borderRadius: "6px",
                border: "none",
                background: zoomLevel >= 5 ? "#555" : "white",
                color: zoomLevel >= 5 ? "#999" : "#667eea",
                cursor: zoomLevel >= 5 ? "not-allowed" : "pointer",
                fontWeight: "bold"
              }}>
              +
            </button>
          </div>

          <button onClick={captureAndProcess} disabled={isProcessing}
            style={{ 
              padding: "15px 40px", 
              fontSize: "1.2em", 
              borderRadius: "8px", 
              border: "none", 
              background: isProcessing ? "#ccc" : "#667eea", 
              color: "white", 
              cursor: isProcessing ? "wait" : "pointer", 
              fontWeight: "bold",
              marginBottom: "20px"
            }}>
            {isProcessing ? "Procesando..." : "Capturar Credencial"}
          </button>

          {/* Mostrar imagen capturada mientras procesa */}
          {capturedImage && isProcessing && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ color: "white" }}>Imagen Capturada:</h3>
              <img src={capturedImage} alt="Credencial capturada" 
                style={{ maxWidth: "90%", maxHeight: "300px", border: "2px solid white", borderRadius: "8px" }} />
            </div>
          )}
        </>
      )}

      {/* PASO 2: ACCESO VALIDADO */}
      {flowStep === 'validated' && ineData && (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ 
            background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", 
            color: "white", 
            padding: "30px", 
            borderRadius: "12px", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)" 
          }}>
            <div style={{ fontSize: "4em", marginBottom: "15px" }}>✅</div>
            <h2 style={{ margin: "0 0 20px 0" }}>INE Válida</h2>
            <p style={{ fontSize: "0.9em", opacity: 0.9, marginBottom: "20px" }}>
              Datos capturados correctamente
            </p>

            <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px", textAlign: "left" }}>
              <p style={{ margin: "8px 0", fontSize: "1.1em" }}>
                <strong>Apellido Paterno:</strong><br/>{ineData.apellidoPaterno}
              </p>
              <p style={{ margin: "8px 0", fontSize: "1.1em" }}>
                <strong>Nombre(s):</strong><br/>{ineData.nombre}
              </p>
              <p style={{ margin: "20px 0 0 0", fontSize: "0.9em", opacity: 0.8 }}>
                Validado: {new Date().toLocaleString('es-MX')}
              </p>
            </div>

            <button onClick={resetReader}
              style={{ 
                padding: "12px 40px", 
                fontSize: "1em", 
                borderRadius: "8px", 
                border: "2px solid white", 
                background: "transparent", 
                color: "white", 
                cursor: "pointer", 
                fontWeight: "bold",
                marginTop: "20px",
                width: "100%"
              }}>
              Validar Otra Persona
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        textAlign: "left", 
        marginTop: "20px", 
        fontSize: "0.85em", 
        padding: "10px", 
        background: "#111", 
        color: "#0f0", 
        maxHeight: 300, 
        overflowY: "scroll", 
        borderRadius: "8px", 
        maxWidth: "600px", 
        margin: "20px auto" 
      }}>
        <strong>Debug log:</strong><br />
        {debugLog.map((log, idx) => <div key={idx}>{log}</div>)}
      </div>
    </div>
  );
}
