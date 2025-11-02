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

    dbg.log("Inicializando camara y lector...");
    setDebugLog((prev) => [...prev, "Iniciando..."]);

    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          const videoTrack = stream.getVideoTracks()[0];
          const capabilities = videoTrack.getCapabilities() as any;
          
          if (capabilities.zoom) {
            dbg.log("Zoom disponible en este dispositivo");
            setDebugLog((prev) => [...prev, "Zoom disponible"]);
            
            videoTrack.applyConstraints({
              advanced: [{ zoom: zoom } as any]
            }).catch(() => {});
          }
        }

        return reader.decodeFromVideoDevice(undefined, videoRef.current!, (res, err) => {
          if (!active) return;

          if (res) {
            const text = res.getText();
            dbg.log("Resultado detectado: " + text.substring(0, 100));
            
            const parsed = parseINECredential(text);
            if (parsed) {
              dbg.log("Credencial INE detectada!");
              console.log("Datos INE:", parsed);
              setIneData(parsed);
              setResult(formatINEData(parsed));
              setDebugLog((prev) => [...prev, "INE leida: " + parsed.nombres + " " + parsed.apellidoPaterno]);
            } else {
              dbg.log("Codigo normal (no INE)");
              setIneData(null);
              setResult(text);
              setDebugLog((prev) => [...prev, "Codigo leido: " + text.substring(0, 50)]);
            }
          }

          if (err && err.name !== 'NotFoundException' && !err.message?.includes('No MultiFormat Readers')) {
            dbg.error("Error al decodificar: " + (err.message || String(err)));
            setDebugLog((prev) => [...prev, "Error: " + (err.message || String(err))]);
          }
        });
      })
      .then(() => {
        dbg.log("Camara iniciada correctamente");
        setDebugLog((prev) => [...prev, "Camara lista - esperando codigo..."]);
      })
      .catch((error: any) => {
        dbg.error("Error al iniciar camara: " + (error.message || String(error)));
        setDebugLog((prev) => [...prev, "ERROR CAMARA: " + (error.message || String(error))]);
        setDebugLog((prev) => [...prev, "Verifica permisos de camara en el navegador"]);
      });

    return () => {
      dbg.log("Deteniendo lector...");
      active = false;
      try {
        if (typeof (reader as any).reset === 'function') {
          (reader as any).reset();
        }
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
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.applyConstraints({
        advanced: [{ zoom: newZoom } as any]
      }).catch(() => {});
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <h2>Lector QR / PDF417 con soporte INE</h2>
      
      <div style={{ 
        margin: "10px auto", 
        padding: "15px",
        background: "#f0f0f0",
        borderRadius: "8px",
        maxWidth: "600px"
      }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
          Zoom: {zoom.toFixed(1)}x
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
          <span>Ajusta el zoom para enfocar mejor el codigo</span>
        </div>
      </div>
      
      <video ref={videoRef} autoPlay muted playsInline style={{ width: "90%", maxWidth: 600, border: "2px solid #333", borderRadius: "8px" }} />
      
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
          <h3 style={{ margin: "0 0 15px 0", textAlign: "center" }}>CREDENCIAL INE</h3>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "8px" }}>
            <p style={{ margin: "5px 0" }}><strong>Nombre:</strong> {ineData.nombres} {ineData.apellidoPaterno} {ineData.apellidoMaterno}</p>
            <p style={{ margin: "5px 0" }}><strong>CURP:</strong> {ineData.curp}</p>
            <p style={{ margin: "5px 0" }}><strong>Clave Elector:</strong> {ineData.claveElector}</p>
            <p style={{ margin: "5px 0" }}><strong>Fecha Nacimiento:</strong> {ineData.fechaNacimiento}</p>
            <p style={{ margin: "5px 0" }}><strong>Sexo:</strong> {ineData.sexo === 'H' ? 'Hombre' : ineData.sexo === 'M' ? 'Mujer' : ineData.sexo}</p>
            <p style={{ margin: "5px 0" }}><strong>Seccion:</strong> {ineData.seccion}</p>
            <p style={{ margin: "5px 0" }}><strong>Municipio:</strong> {ineData.municipio}</p>
            <p style={{ margin: "5px 0" }}><strong>Estado:</strong> {ineData.estado}</p>
            <p style={{ margin: "5px 0" }}><strong>Domicilio:</strong> {ineData.domicilio}</p>
            <p style={{ margin: "5px 0" }}><strong>Vigencia:</strong> {ineData.vigencia}</p>
            <p style={{ margin: "5px 0" }}><strong>Emision:</strong> {ineData.emision}</p>
          </div>
        </div>
      ) : result ? (
        <div style={{ background: "#e0ffe0", padding: "15px", borderRadius: "8px", margin: "20px auto", maxWidth: "600px" }}>
          <strong>Codigo detectado:</strong> 
          <pre style={{ marginTop: "10px", whiteSpace: "pre-wrap", textAlign: "left", fontSize: "0.9em" }}>{result}</pre>
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
