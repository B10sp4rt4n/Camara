import { QRCodeSVG } from 'qrcode.react';

export default function QRLink() {
  const url = "https://b10sp4rt4n.github.io/Camara/";
  
  return (
    <div style={{ 
      textAlign: "center", 
      padding: "20px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      borderRadius: "12px",
      margin: "20px auto",
      maxWidth: "400px",
      color: "white",
      boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
    }}>
      <h2 style={{ margin: "0 0 15px 0" }}>📱 Escanea para abrir en tu celular</h2>
      
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "8px",
        display: "inline-block"
      }}>
        <QRCodeSVG 
          value={url} 
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>
      
      <p style={{ 
        marginTop: "15px", 
        fontSize: "0.9em",
        wordBreak: "break-all"
      }}>
        🔗 <a href={url} style={{ color: "#fff", textDecoration: "underline" }}>{url}</a>
      </p>
      
      <p style={{ 
        fontSize: "0.85em", 
        opacity: 0.9,
        marginTop: "10px"
      }}>
        💡 Asegúrate de dar permisos de cámara en tu navegador móvil
      </p>
    </div>
  );
}
