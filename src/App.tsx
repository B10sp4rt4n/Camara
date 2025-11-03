import { useState } from "react";
import SimpleQRReader from "./components/SimpleQRReader";
import INEOCRReader from "./components/INEOCRReader";
import QRLink from "./components/QRLink";

type TabType = 'qr-barcode' | 'ine-validator';
type QRMode = 'barcode' | 'ocr-front';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('ine-validator');
  const [qrMode, setQRMode] = useState<QRMode>('barcode');

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header con pestañas */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ 
          margin: "0 0 20px 0", 
          textAlign: "center", 
          color: "white",
          fontSize: "1.8em"
        }}>
          Sistema de Validación
        </h1>
        
        <div style={{ 
          display: "flex", 
          gap: "10px", 
          maxWidth: "600px", 
          margin: "0 auto",
          justifyContent: "center"
        }}>
          <button
            onClick={() => setActiveTab('ine-validator')}
            style={{
              flex: 1,
              padding: "12px 20px",
              fontSize: "1em",
              borderRadius: "8px",
              border: "none",
              background: activeTab === 'ine-validator' ? "white" : "rgba(255,255,255,0.2)",
              color: activeTab === 'ine-validator' ? "#667eea" : "white",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.3s",
              boxShadow: activeTab === 'ine-validator' ? "0 4px 6px rgba(0,0,0,0.1)" : "none"
            }}
          >
             Validación INE
          </button>
          
          <button
            onClick={() => setActiveTab('qr-barcode')}
            style={{
              flex: 1,
              padding: "12px 20px",
              fontSize: "1em",
              borderRadius: "8px",
              border: "none",
              background: activeTab === 'qr-barcode' ? "white" : "rgba(255,255,255,0.2)",
              color: activeTab === 'qr-barcode' ? "#667eea" : "white",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.3s",
              boxShadow: activeTab === 'qr-barcode' ? "0 4px 6px rgba(0,0,0,0.1)" : "none"
            }}
          >
             Lectores
          </button>
        </div>
      </div>

      {/* Contenido según pestaña activa */}
      <div style={{ padding: "20px" }}>
        {activeTab === 'ine-validator' && <INEOCRReader />}
        
        {activeTab === 'qr-barcode' && (
          <>
            {/* Selector de modo de lectura */}
            <div style={{
              background: "#fff",
              padding: "15px",
              borderRadius: "12px",
              maxWidth: "600px",
              margin: "0 auto 20px auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 15px 0", textAlign: "center", color: "#333" }}>
                Modo de Lectura
              </h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setQRMode('barcode')}
                  style={{
                    flex: 1,
                    padding: "12px 15px",
                    fontSize: "0.95em",
                    borderRadius: "8px",
                    border: "2px solid #667eea",
                    background: qrMode === 'barcode' ? "#667eea" : "#fff",
                    color: qrMode === 'barcode' ? "white" : "#667eea",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                   QR / Códigos de Barras
                </button>
                
                <button
                  onClick={() => setQRMode('ocr-front')}
                  style={{
                    flex: 1,
                    padding: "12px 15px",
                    fontSize: "0.95em",
                    borderRadius: "8px",
                    border: "2px solid #667eea",
                    background: qrMode === 'ocr-front' ? "#667eea" : "#fff",
                    color: qrMode === 'ocr-front' ? "white" : "#667eea",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                   OCR INE Frontal
                </button>
              </div>
            </div>

            {/* Componente según modo seleccionado */}
            {qrMode === 'barcode' && (
              <>
                <QRLink />
                <SimpleQRReader />
              </>
            )}
            
            {qrMode === 'ocr-front' && <INEOCRReader />}
          </>
        )}
      </div>
    </div>
  );
}
