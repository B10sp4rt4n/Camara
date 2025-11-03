import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { AUPDebugger } from "../core/aup_debugger";
import { parseINECredential, type INEData } from "../utils/ineParser";

export default function SimpleQRReader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<string | null>(null);
  const [ineData, setIneData] = useState<INEData | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isScanning, setIsScanning] = useState(true);
  const dbg = new AUPDebugger("SimpleQRReader");

  const resetReader = () => {
    setResult(null);
    setIneData(null);
    setIsScanning(true);
    setDebugLog((prev) => [...prev, "Reiniciando escaner..."]);
  };

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
            dbg.log("Zoom disponible");
            setDebugLog((prev) => [...prev, "Zoom disponible"]);
            videoTrack.applyConstraints({
              advanced: [{ zoom: zoom } as any]
            }).catch(() => {});
          }
        }

        return reader.decodeFromVideoDevice(undefined, videoRef.current!, (res, err) => {
          if (!active || !isScanning) return;

          if (res) {
            const text = res.getText();
            console.log("TEXTO DETECTADO:", text);
            
            // DETENER ESCANEO
            setIsScanning(false);
            
            // Mostrar info del texto en debug log
            const parts = text.split('|');
            setDebugLog((prev) => [...prev, "Codigo detectado - " + parts.length + " campos"]);
            setDebugLog((prev) => [...prev, "Primeros campos: " + parts.slice(0, 3).join(' / ')]);
            
            const parsed = parseINECredential(text);
            console.log("RESULTADO PARSE:", parsed);
            
            if (parsed) {
              console.log("ES INE! Seteando ineData...");
              setIneData(parsed);
              setResult(null);
              setDebugLog((prev) => [...prev, "INE DETECTADA: " + parsed.nombres + " " + parsed.apellidoPaterno]);
              setDebugLog((prev) => [...prev, "ESCANEO PAUSADO - Presiona 'Escanear Otra' para continuar"]);
            } else {
              console.log("NO es INE, es codigo normal");
              setIneData(null);
              setResult(text);
              setDebugLog((prev) => [...prev, "Codigo normal (no INE): " + text.substring(0, 40)]);
              setDebugLog((prev) => [...prev, "ESCANEO PAUSADO - Presiona 'Escanear Otra' para continuar"]);
            }
          }

          if (err && err.name !== 'NotFoundException' && !err.message?.includes('No MultiFormat Readers')) {
            setDebugLog((prev) => [...prev, "Error: " + err.message]);
          }
        });
      })
      .then(() => {
        setDebugLog((prev) => [...prev, "Camara lista"]);
      })
      .catch((error: any) => {
        setDebugLog((prev) => [...prev, "ERROR CAMARA: " + error.message]);
      });

    return () => {
      active = false;
      try {
        if (typeof (reader as any).reset === 'function') {
          (reader as any).reset();
        }
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {}
    };
  }, [zoom, isScanning]);

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

  console.log("RENDER - ineData:", ineData);
  console.log("RENDER - result:", result);
  console.log("RENDER - isScanning:", isScanning);

  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <h2>Lector QR / PDF417 con soporte INE</h2>
      
      <div style={{ margin: "10px auto", padding: "20px", background: "#fff", borderRadius: "12px", maxWidth: "600px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <label style={{ display: "block", marginBottom: "15px", fontWeight: "bold", fontSize: "1.1em", textAlign: "center" }}>
          🔍 Zoom: {zoom.toFixed(1)}x
        </label>
        <input type="range" min="1" max="3" step="0.1" value={zoom}
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
          style={{ width: "100%", cursor: "pointer", height: "40px" }} />
        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button onClick={() => handleZoomChange(1)}
            style={{ 
              flex: 1,
              padding: "12px 20px", 
              borderRadius: "8px", 
              border: "2px solid #667eea", 
              background: zoom === 1 ? "#667eea" : "#fff", 
              color: zoom === 1 ? "white" : "#667eea",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1em"
            }}>
            1x
          </button>
          <button onClick={() => handleZoomChange(2)}
            style={{ 
              flex: 1,
              padding: "12px 20px", 
              borderRadius: "8px", 
              border: "2px solid #667eea", 
              background: zoom === 2 ? "#667eea" : "#fff", 
              color: zoom === 2 ? "white" : "#667eea",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1em"
            }}>
            2x
          </button>
          <button onClick={() => handleZoomChange(3)}
            style={{ 
              flex: 1,
              padding: "12px 20px", 
              borderRadius: "8px", 
              border: "2px solid #667eea", 
              background: zoom === 3 ? "#667eea" : "#fff", 
              color: zoom === 3 ? "white" : "#667eea",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1em"
            }}>
            3x
          </button>
        </div>
      </div>
      
      <video ref={videoRef} autoPlay muted playsInline style={{ width: "90%", maxWidth: 600, border: "2px solid #333", borderRadius: "8px", opacity: isScanning ? 1 : 0.5 }} />
      
      {!isScanning && (
        <div style={{ marginTop: "15px" }}>
          <button onClick={resetReader}
            style={{ padding: "12px 30px", fontSize: "1.1em", borderRadius: "8px", border: "2px solid #667eea", background: "#667eea", color: "white", cursor: "pointer", fontWeight: "bold" }}>
            Escanear Otra Credencial
          </button>
        </div>
      )}
      
      {ineData && (
        <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", padding: "20px", borderRadius: "12px", margin: "20px auto", maxWidth: "600px", textAlign: "left", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
          <h3 style={{ margin: "0 0 15px 0", textAlign: "center" }}>CREDENCIAL INE</h3>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "8px" }}>
            <p style={{ margin: "8px 0", fontSize: "1.1em" }}><strong>Nombre:</strong><br/>{ineData.nombres} {ineData.apellidoPaterno} {ineData.apellidoMaterno}</p>
            <p style={{ margin: "8px 0" }}><strong>CURP:</strong><br/>{ineData.curp}</p>
            <p style={{ margin: "8px 0" }}><strong>Clave Elector:</strong><br/>{ineData.claveElector}</p>
            <p style={{ margin: "8px 0" }}><strong>Fecha Nacimiento:</strong><br/>{ineData.fechaNacimiento}</p>
            <p style={{ margin: "8px 0" }}><strong>Sexo:</strong><br/>{ineData.sexo === 'H' ? 'Hombre' : ineData.sexo === 'M' ? 'Mujer' : ineData.sexo}</p>
            <p style={{ margin: "8px 0" }}><strong>Seccion:</strong><br/>{ineData.seccion}</p>
            <p style={{ margin: "8px 0" }}><strong>Municipio:</strong><br/>{ineData.municipio}</p>
            <p style={{ margin: "8px 0" }}><strong>Estado:</strong><br/>{ineData.estado}</p>
            <p style={{ margin: "8px 0" }}><strong>Domicilio:</strong><br/>{ineData.domicilio}</p>
            <p style={{ margin: "8px 0" }}><strong>Vigencia:</strong><br/>{ineData.vigencia}</p>
            <p style={{ margin: "8px 0" }}><strong>Emision:</strong><br/>{ineData.emision}</p>
          </div>
        </div>
      )}
      
      {!ineData && result && (
        <div style={{ background: "#e0ffe0", padding: "15px", borderRadius: "8px", margin: "20px auto", maxWidth: "600px" }}>
          <strong>Codigo detectado (no INE):</strong>
          <pre style={{ marginTop: "10px", whiteSpace: "pre-wrap", textAlign: "left", fontSize: "0.9em" }}>{result}</pre>
        </div>
      )}
      
      <div style={{ textAlign: "left", marginTop: "20px", fontSize: "0.85em", padding: "10px", background: "#111", color: "#0f0", maxHeight: 300, overflowY: "scroll", borderRadius: "8px", maxWidth: "600px", margin: "20px auto" }}>
        <strong>Debug log:</strong><br />
        {debugLog.map((log, idx) => <div key={idx}>{log}</div>)}
      </div>
    </div>
  );
}
