import { useEffect, useRef, useState } from "react";
import { AUPDebugger } from "../core/aup_debugger";

export default function CameraViewer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Inicializando...");
  const dbg = new AUPDebugger("CameraViewer");

  useEffect(() => {
    async function initCamera() {
      try {
        dbg.log("Solicitando cámara");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        videoRef.current!.srcObject = stream;
        dbg.log("Cámara activa");
        setStatus("✅ Cámara lista");
      } catch (err: any) {
        dbg.error(err.message);
        setStatus("❌ No se pudo acceder a la cámara");
      }
    }
    initCamera();
  }, []);

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          maxWidth: "600px",
          borderRadius: "10px",
          border: "2px solid #444"
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "10%",
          width: "80%",
          height: "60%",
          border: "3px solid lime",
          borderRadius: "12px",
          boxShadow: "0 0 20px rgba(0,255,0,0.3)",
          pointerEvents: "none"
        }}
      ></div>
      <p style={{ marginTop: "10px" }}>{status}</p>
      <p style={{ color: "#0f0", fontWeight: "bold" }}>
        Alinea el código dentro del marco
      </p>
    </div>
  );
}