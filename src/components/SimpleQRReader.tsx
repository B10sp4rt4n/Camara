import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { AUPDebugger } from "../core/aup_debugger";
import { parseINECredential, formatINEData, type INEData } from "../utils/ineParser";

export default function SimpleQRReader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<string | null>(null);
  const [ineData, setIneData] = useState<INEData | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const dbg = new AUPDebugger("SimpleQRReader");

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let active = true;

    dbg.log("Inicializando cámara y lector...");
    setDebugLog((prev) => [...prev, "🔄 Iniciando..."]);

    // Configuración para cámara con mayor resolución y cámara trasera en móviles
    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };

    // Iniciar cámara con configuración
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Intentar habilitar zoom si está disponible
          const videoTrack = stream.getVideoTracks()[0];
          const capabilities = videoTrack.getCapabilities() as any;
          
          if (capabilities.zoom) {
            dbg.log("📸 Zoom disponible en este dispositivo");
            setDebugLog((prev) => [...prev, "📸 Zoom disponible"]);
            
            // Aplicar zoom inicial
            videoTrack.applyConstraints({
              advanced: [{ zoom: zoom } as any]
            }).catch(() => {});
          }
        }

        // Iniciar detección
        return reader.decodeFromVideoDevice(undefined, videoRef.current!, (res, err) => {
          if (!active) return;

          if (res) {
            const text = res.getText();
            dbg.log("📦 Resultado detectado: " + text.substring(0, 100));
            
            // Detectar si es credencial INE (formato con pipes)
            const parsed = parseINECredential(text);
            if (parsed) {
              dbg.log("🆔 Credencial INE detectada");
              setIneData(parsed);
              setResult(formatINEData(parsed));
              setDebugLog((prev) => [...prev, "🆔 Credencial INE leída correctamente"]);
            } else {
              setIneData(null);
              setResult(text);
              setDebugLog((prev) => [...prev, "✔️ Código leído: " + text.substring(0, 50)]);
            }
          }

          if (err && err.name !== 'NotFoundException' && !err.message?.includes('No MultiFormat Readers')) {
            dbg.error("⚠️ Error al decodificar: " + (err.message || String(err)));
            setDebugLog((prev) => [...prev, "❌ Error: " + (err.message || String(err))]);
          }
        });
      })
      .then(() => {
        dbg.log("✅ Cámara iniciada correctamente");
        setDebugLog((prev) => [...prev, "✅ Cámara lista - esperando código..."]);
      })
      .catch((error: any) => {
        dbg.error("❌ Error al iniciar cámara: " + (error.message || String(error)));
        setDebugLog((prev) => [...prev, "❌ ERROR CÁMARA: " + (error.message || String(error))]);
        setDebugLog((prev) => [...prev, "💡 Verifica permisos de cámara en el navegador"]);
      });

    return () => {
      dbg.log("Deteniendo lector...");
      active = false;
      try {
        if (typeof (reader as any).reset === 'function') {
          (reader as any).reset();
        }
        // Detener stream de video
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        // ignore
      }
    };
  }, [zoom]);

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    
    // Aplicar zoom si el dispositivo lo soporta
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.applyConstraints({
        advanced: [{ zoom: newZoom } as any]
      }).catch(() => {});
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🧪 Lector QR / PDF417 con soporte INE</h2>
      
      {/* Controles de Zoom para Móvil */}
      <div style={{ 
        margin: "10px auto", 
        padding: "15px",
        background: "#f0f0f0",
        borderRadius: "8px",
        maxWidth: "600px"
      }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
          📱 Zoom: {zoom.toFixed(1)}x
        </label>
        <input 
          type="range" 
          min="1" 
          max="3" 
          step="0.1" 
          value={zoom}
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
          style={{ width: "100%", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85em", color: "#666", marginTop: "5px" }}>
          <button 
            onClick={() => handleZoomChange(1)}
            style={{ padding: "5px 15px", borderRadius: "4px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
          >
            Reset
          </button>
          <span>💡 Ajusta el zoom para enfocar mejor el código</span>
        </div>
      </div>
      
      <video ref={videoRef} autoPlay muted playsInline style={{ width: "90%", maxWidth: 600, border: "2px solid #333" }} />
      
      {ineData ? (
        <div style={{ 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
          color: "white",
          padding: "20px", 
          borderRadius: "12px",
          margin: "20px auto",
          maxWidth: "600px",
          textAlign: "left",
          boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
        }}>
          <h3 style={{ margin: "0 0 15px 0", textAlign: "center" }}>🆔 CREDENCIAL INE</h3>
          <pre style={{ 
            background: "rgba(0,0,0,0.2)", 
            padding: "15px", 
            borderRadius: "8px",
            whiteSpace: "pre-wrap",
            fontSize: "0.9em",
            lineHeight: "1.6"
          }}>{result}</pre>
        </div>
      ) : result ? (
        <div style={{ background: "#e0ffe0", padding: "15px", borderRadius: "8px", margin: "20px auto", maxWidth: "600px" }}>
          <strong>Código detectado:</strong> 
          <pre style={{ marginTop: "10px", whiteSpace: "pre-wrap", textAlign: "left" }}>{result}</pre>
        </div>
      ) : null}
      
      <div style={{ 
        textAlign: "left", 
        marginTop: "20px", 
        fontSize: "0.85em", 
        padding: "10px", 
        background: "#111", 
        color: "#0f0", 
        maxHeight: 300, 
        overflowY: "scroll",
        borderRadius: "8px"
      }}>
        <strong>Debug log:</strong><br />
        {debugLog.map((log, idx) => <div key={idx}>{log}</div>)}
      </div>
    </div>
  );
}