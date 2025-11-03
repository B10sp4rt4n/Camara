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

  useEffect(() => {
    if (flowStep === 'capture') {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(mediaStream => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
            setDebugLog(prev => [...prev, "Camara iniciada"]);
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
  }, [flowStep]);

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setDebugLog(prev => [...prev, "Capturando imagen..."]);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/png');
    
    setDebugLog(prev => [...prev, "Procesando con OCR..."]);

    try {
      const result = await Tesseract.recognize(imageData, 'spa', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setDebugLog(prev => [...prev, 'OCR progreso: ' + Math.round(m.progress * 100) + '%']);
          }
        }
      });

      const text = result.data.text;
      setDebugLog(prev => [...prev, "Texto detectado, parseando..."]);
      console.log("TEXTO OCR:", text);

      const parsed = parseINEFromOCR(text);
      if (parsed && (parsed.apellidoPaterno || parsed.nombre)) {
        setIneData(parsed);
        setDebugLog(prev => [...prev, "✅ INE válida: " + parsed.apellidoPaterno + " " + parsed.nombre]);
        // Cambiar directamente a validado
        setFlowStep('validated');
      } else {
        setDebugLog(prev => [...prev, "❌ No se pudo detectar nombre en la credencial. Intenta de nuevo."]);
      }
    } catch (error: any) {
      setDebugLog(prev => [...prev, "ERROR OCR: " + error.message]);
    }

    setIsProcessing(false);
  };

  const parseINEFromOCR = (text: string): INEDataOCR | null => {
    try {
      console.log("========== TEXTO COMPLETO OCR ==========");
      console.log(text);
      console.log("========================================");
      
      // Limpiar y normalizar el texto
      const cleanText = text
        .replace(/[^\w\sÁÉÍÓÚÑáéíóúñ]/g, ' ')
        .replace(/\s+/g, ' ')
        .toUpperCase()
        .trim();
      
      console.log("Texto limpio:", cleanText);
      
      // Dividir en líneas y filtrar vacías
      const lines = text.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      
      console.log("Líneas detectadas:", lines);
      
      let apellidoPaterno = '';
      let nombre = '';
      
      // Método 1: Buscar líneas que contengan solo letras mayúsculas (típico de nombres en INE)
      const nameLines = lines.filter(line => {
        const cleanLine = line.trim();
        // Debe tener entre 3 y 40 caracteres, solo letras mayúsculas y espacios
        return /^[A-ZÁÉÍÓÚÑ\s]{3,40}$/.test(cleanLine);
      });
      
      console.log("Líneas de nombre potenciales:", nameLines);
      
      if (nameLines.length >= 2) {
        apellidoPaterno = nameLines[0].trim();
        nombre = nameLines[1].trim();
        console.log("Método 1 exitoso - Apellido:", apellidoPaterno, "Nombre:", nombre);
      }
      
      // Método 2: Buscar por palabras clave
      if (!apellidoPaterno || !nombre) {
        const upperText = text.toUpperCase();
        
        // Buscar patrón: APELLIDOS seguido de texto
        const apellidoMatch = upperText.match(/(?:APELLIDOS?|APELLIDO\s*PATERNO)[:\s]*([A-ZÁÉÍÓÚÑ\s]{3,30})/);
        if (apellidoMatch) {
          apellidoPaterno = apellidoMatch[1].trim().split(/\s+/).slice(0, 2).join(' ');
          console.log("Apellido encontrado con patrón:", apellidoPaterno);
        }
        
        // Buscar patrón: NOMBRE seguido de texto
        const nombreMatch = upperText.match(/NOMBRE[S]?[:\s]*([A-ZÁÉÍÓÚÑ\s]{2,30})/);
        if (nombreMatch) {
          nombre = nombreMatch[1].trim().split(/\s+/).slice(0, 3).join(' ');
          console.log("Nombre encontrado con patrón:", nombre);
        }
      }
      
      // Método 3: Tomar las primeras palabras en mayúsculas del texto
      if (!apellidoPaterno || !nombre) {
        const words = cleanText.split(' ').filter(w => w.length > 2 && /^[A-ZÁÉÍÓÚÑ]+$/.test(w));
        console.log("Palabras en mayúsculas:", words);
        
        if (words.length >= 2) {
          apellidoPaterno = words[0];
          nombre = words.slice(1, 3).join(' ');
          console.log("Método 3 - Apellido:", apellidoPaterno, "Nombre:", nombre);
        }
      }
      
      // Si aún no tenemos datos, intentar extraer cualquier texto
      if (!apellidoPaterno && !nombre) {
        const allWords = lines
          .filter(l => l.length > 2)
          .map(l => l.toUpperCase().trim());
        
        if (allWords.length >= 2) {
          apellidoPaterno = allWords[0];
          nombre = allWords[1];
          console.log("Método de respaldo - Apellido:", apellidoPaterno, "Nombre:", nombre);
        }
      }

      if (!apellidoPaterno && !nombre) {
        console.log("❌ No se pudo extraer ningún dato del texto OCR");
        return null;
      }

      const result = {
        apellidoPaterno: apellidoPaterno || 'NO DETECTADO',
        nombre: nombre || 'NO DETECTADO',
        rawText: text
      };
      
      console.log("✅ Resultado final:", result);
      return result;
      
    } catch (error) {
      console.error('❌ Error parsing OCR:', error);
      return null;
    }
  };

  const resetReader = () => {
    setIneData(null);
    setFlowStep('capture');
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

          <video ref={videoRef} autoPlay muted playsInline 
            style={{ width: "90%", maxWidth: 600, border: "2px solid #333", borderRadius: "8px", marginBottom: "15px" }} />

          <canvas ref={canvasRef} style={{ display: "none" }} />

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
