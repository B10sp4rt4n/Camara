import { useEffect, useRef, useState } from "react";
import { AUPDebugger } from "../core/aup_debugger";

export default function CameraViewer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Inicializando...");
  const [photo, setPhoto] = useState<string | null>(null);
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

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setPhoto(dataUrl);
      }
    }
  };

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
      <canvas ref={canvasRef} style={{ display: "none" }} />
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
      <button onClick={handleCapture} style={{ marginTop: "16px", padding: "10px 20px", fontSize: "16px", borderRadius: "8px", background: "#222", color: "#fff", border: "none", cursor: "pointer" }}>
        Capturar foto
      </button>
      <p style={{ marginTop: "10px" }}>{status}</p>
      <p style={{ color: "#0f0", fontWeight: "bold" }}>
        Alinea el código dentro del marco
      </p>
      {photo && (
        <div style={{ marginTop: "20px" }}>
          <h4>Foto capturada:</h4>
          <img src={photo} alt="captura" style={{ maxWidth: "100%", borderRadius: "10px", border: "2px solid #444" }} />
        </div>
      )}
    </div>
  );
}