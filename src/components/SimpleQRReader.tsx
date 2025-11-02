import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { AUPDebugger } from "../core/aup_debugger";

export default function SimpleQRReader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const dbg = new AUPDebugger("SimpleQRReader");

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let active = true;

    dbg.log("Inicializando cámara y lector...");
    setDebugLog((prev) => [...prev, "🔄 Iniciando..."]);

    // Try to start the camera
    reader.decodeFromVideoDevice(undefined, videoRef.current!, (res, err) => {
      if (!active) return;

      if (res) {
        const text = res.getText();
        dbg.log("📦 Resultado detectado: " + text);
        setResult(text);
        setDebugLog((prev) => [...prev, "✔️ Código leído: " + text]);
      }

      // Only log errors that are NOT "code not found" errors
      if (err && err.name !== 'NotFoundException' && !err.message?.includes('No MultiFormat Readers')) {
        dbg.error("⚠️ Error al decodificar: " + (err.message || String(err)));
        setDebugLog((prev) => [...prev, "❌ Error: " + (err.message || String(err))]);
      }
    }).then(() => {
      dbg.log("✅ Cámara iniciada correctamente");
      setDebugLog((prev) => [...prev, "✅ Cámara lista - esperando código..."]);
    }).catch((error: any) => {
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
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🧪 Lector QR Simplificado (Modo Debug)</h2>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: "90%", maxWidth: 600, border: "2px solid #333" }} />
      {result && <p style={{ background: "#e0ffe0", padding: "8px", borderRadius: "8px" }}><strong>Detectado:</strong> {result}</p>}
      <div style={{ textAlign: "left", marginTop: "10px", fontSize: "0.85em", padding: "10px", background: "#111", color: "#0f0", maxHeight: 300, overflowY: "scroll" }}>
        <strong>Debug log:</strong><br />
        {debugLog.map((log, idx) => <div key={idx}>{log}</div>)}
      </div>
    </div>
  );
}