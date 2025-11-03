import { useEffect, useRef, useState } from "react";
import Tesseract from 'tesseract.js';

interface INEDataOCR {
  nombre: string;
  apellidoPaterno: string;
  claveElector: string;
  ocr: string;
  numeroEmisionVertical: string;
  rawText: string;
}

type FlowStep = 'capture' | 'ine-validation' | 'validated';

export default function INEOCRReader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ineData, setIneData] = useState<INEDataOCR | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('capture');
  const [captchaImageUrl, setCaptchaImageUrl] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');

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
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setDebugLog(prev => [...prev, 'OCR progreso: ' + Math.round(m.progress * 100) + '%']);
          }
        }
      });

      const text = result.data.text;
      setDebugLog(prev => [...prev, "Texto detectado, parseando..."]);
      console.log("TEXTO OCR:", text);

      const parsed = parseINEFromOCR(text);
      if (parsed) {
        setIneData(parsed);
        setDebugLog(prev => [...prev, "INE detectada: " + parsed.apellidoPaterno + " " + parsed.nombre]);
        setFlowStep('ine-validation');
        loadINECaptcha(parsed);
      } else {
        setDebugLog(prev => [...prev, "No se pudo parsear INE del texto"]);
      }
    } catch (error: any) {
      setDebugLog(prev => [...prev, "ERROR OCR: " + error.message]);
    }

    setIsProcessing(false);
  };

  const parseINEFromOCR = (text: string): INEDataOCR | null => {
    try {
      console.log("Parseando texto OCR:", text);
      
      const lines = text.split('\n').filter(l => l.trim().length > 2);
      let apellidoPaterno = '';
      let nombre = '';
      let claveElector = '';
      let ocr = '';
      let numeroEmisionVertical = '';
      
      for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const line = lines[i].trim();
        
        if (line.match(/^[A-ZÁÉÍÓÚÑ\s]{3,}$/)) {
          if (!apellidoPaterno) {
            apellidoPaterno = line;
            console.log("Apellido Paterno detectado:", line);
          } else if (!nombre) {
            nombre = line;
            console.log("Nombre detectado:", line);
          }
        }
        
        const claveMatch = line.match(/[A-Z]{6}\d{8}[HM]\d{3}/);
        if (claveMatch) {
          claveElector = claveMatch[0];
          console.log("Clave Elector detectada:", claveElector);
        }
        
        const ocrMatch = line.match(/\d{13}/);
        if (ocrMatch && !ocr) {
          ocr = ocrMatch[0];
          console.log("OCR detectado:", ocr);
        }
        
        const emisionMatch = line.match(/\d{9}/);
        if (emisionMatch && emisionMatch[0] !== ocr && !numeroEmisionVertical) {
          numeroEmisionVertical = emisionMatch[0];
          console.log("Num Emisión detectado:", numeroEmisionVertical);
        }
      }

      if (!apellidoPaterno && !nombre) {
        console.log("No se encontro nombre ni apellido");
        return null;
      }

      return {
        apellidoPaterno,
        nombre,
        claveElector,
        ocr,
        numeroEmisionVertical,
        rawText: text
      };
    } catch (error) {
      console.error('Error parsing OCR:', error);
      return null;
    }
  };

  const loadINECaptcha = async (data: INEDataOCR) => {
    setDebugLog(prev => [...prev, "Cargando CAPTCHA del INE..."]);
    
    try {
      const ineUrl = 'https://listanominal.ine.mx/scpln/';
      const captchaResponse = await fetch(ineUrl + 'captcha', {
        method: 'GET',
        mode: 'cors'
      });
      
      if (captchaResponse.ok) {
        const blob = await captchaResponse.blob();
        const imageUrl = URL.createObjectURL(blob);
        setCaptchaImageUrl(imageUrl);
        setDebugLog(prev => [...prev, "CAPTCHA del INE cargado"]);
      } else {
        setDebugLog(prev => [...prev, "Error al cargar CAPTCHA: " + captchaResponse.status]);
        setCaptchaImageUrl('');
      }
    } catch (error: any) {
      setDebugLog(prev => [...prev, "Error de red al cargar CAPTCHA: " + error.message]);
      setCaptchaImageUrl('');
    }
  };

  const validateWithINE = async () => {
    if (!ineData) return;
    
    setIsProcessing(true);
    setDebugLog(prev => [...prev, "Validando con sistema INE..."]);
    
    try {
      const formData = new FormData();
      formData.append('claveElector', ineData.claveElector);
      formData.append('ocr', ineData.ocr);
      formData.append('numeroEmisionVertical', ineData.numeroEmisionVertical);
      formData.append('captcha', userCaptchaInput);
      
      const response = await fetch('https://listanominal.ine.mx/scpln/', {
        method: 'POST',
        body: formData,
        mode: 'cors'
      });
      
      if (response.ok) {
        const html = await response.text();
        if (html.includes('VIGENTE') || html.includes('vigente')) {
          setDebugLog(prev => [...prev, " Credencial VIGENTE validada por INE"]);
          setFlowStep('validated');
        } else if (html.includes('NO VIGENTE')) {
          setDebugLog(prev => [...prev, " Credencial NO VIGENTE según INE"]);
        } else {
          setDebugLog(prev => [...prev, " CAPTCHA incorrecto, intenta de nuevo"]);
          setUserCaptchaInput('');
          loadINECaptcha(ineData);
        }
      }
    } catch (error: any) {
      setDebugLog(prev => [...prev, "Error al validar: " + error.message]);
    }
    
    setIsProcessing(false);
  };

  const resetReader = () => {
    setIneData(null);
    setFlowStep('capture');
    setUserCaptchaInput('');
    setCaptchaImageUrl('');
    setDebugLog(prev => [...prev, "Reiniciando..."]);
  };

  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <h2>Validación de Acceso con INE</h2>
      
      {flowStep === 'capture' && (
        <>
          <p style={{ fontSize: "0.9em", color: "#666" }}>
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

      {flowStep === 'ine-validation' && ineData && (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ 
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
            color: "white", 
            padding: "20px", 
            borderRadius: "12px", 
            marginBottom: "20px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)" 
          }}>
            <h3 style={{ margin: "0 0 15px 0" }}>Datos Capturados</h3>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "8px", textAlign: "left" }}>
              <p style={{ margin: "8px 0" }}><strong>Apellido Paterno:</strong><br/>{ineData.apellidoPaterno}</p>
              <p style={{ margin: "8px 0" }}><strong>Nombre(s):</strong><br/>{ineData.nombre}</p>
              {ineData.claveElector && <p style={{ margin: "8px 0", fontSize: "0.85em" }}><strong>Clave Elector:</strong> {ineData.claveElector}</p>}
            </div>
          </div>

          <div style={{ 
            background: "#fff", 
            padding: "30px", 
            borderRadius: "12px", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "2px solid #667eea"
          }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>Validación con Sistema INE</h3>
            
            {captchaImageUrl ? (
              <>
                <p style={{ fontSize: "0.9em", color: "#666", marginBottom: "15px" }}>
                  Ingresa el código CAPTCHA del sistema INE:
                </p>
                
                <img src={captchaImageUrl} alt="CAPTCHA INE" 
                  style={{ 
                    border: "2px solid #ddd", 
                    borderRadius: "8px", 
                    marginBottom: "15px",
                    maxWidth: "100%"
                  }} />
              </>
            ) : (
              <p style={{ fontSize: "0.9em", color: "#999", marginBottom: "15px" }}>
                 No se pudo cargar CAPTCHA del INE. Validación manual.
              </p>
            )}
            
            <input 
              type="text" 
              value={userCaptchaInput}
              onChange={(e) => setUserCaptchaInput(e.target.value)}
              placeholder="Ingresa el código CAPTCHA"
              style={{ 
                width: "100%", 
                padding: "12px", 
                fontSize: "1.2em", 
                borderRadius: "8px", 
                border: "2px solid #ddd",
                textAlign: "center",
                marginBottom: "15px",
                boxSizing: "border-box"
              }}
            />
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={validateWithINE} disabled={isProcessing || !userCaptchaInput}
                style={{ 
                  flex: 1,
                  padding: "12px 25px", 
                  fontSize: "1em", 
                  borderRadius: "8px", 
                  border: "none", 
                  background: (isProcessing || !userCaptchaInput) ? "#ccc" : "#667eea", 
                  color: "white", 
                  cursor: (isProcessing || !userCaptchaInput) ? "not-allowed" : "pointer", 
                  fontWeight: "bold"
                }}>
                {isProcessing ? "Validando..." : "Validar con INE"}
              </button>
              
              <button onClick={() => loadINECaptcha(ineData)}
                style={{ 
                  padding: "12px 25px", 
                  fontSize: "1em", 
                  borderRadius: "8px", 
                  border: "2px solid #667eea", 
                  background: "transparent", 
                  color: "#667eea", 
                  cursor: "pointer", 
                  fontWeight: "bold"
                }}>
                
              </button>
              
              <button onClick={resetReader}
                style={{ 
                  padding: "12px 25px", 
                  fontSize: "1em", 
                  borderRadius: "8px", 
                  border: "2px solid #999", 
                  background: "transparent", 
                  color: "#999", 
                  cursor: "pointer", 
                  fontWeight: "bold"
                }}>
                
              </button>
            </div>
          </div>
        </div>
      )}

      {flowStep === 'validated' && ineData && (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ 
            background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", 
            color: "white", 
            padding: "30px", 
            borderRadius: "12px", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)" 
          }}>
            <div style={{ fontSize: "4em", marginBottom: "15px" }}></div>
            <h2 style={{ margin: "0 0 20px 0" }}>Credencial Vigente</h2>
            <p style={{ fontSize: "0.9em", opacity: 0.9, marginBottom: "20px" }}>
              Validado por sistema oficial del INE
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
