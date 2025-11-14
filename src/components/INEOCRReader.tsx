import React, { useRef, useState, useEffect } from "react";

const INEOCRReader: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } // Cámara frontal
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('No se pudo acceder a la cámara');
      }
    };
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 400, 300);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg');
    setPhoto(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const cropImageToTextArea = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageDataUrl);
          return;
        }

        // Recortar zona de texto derecha donde están NOMBRE, DOMICILIO, CURP, etc.
        // Desde después de la foto (30%) hasta el borde derecho (95%), altura central
        const cropX = img.width * 0.30;
        const cropY = img.height * 0.15;
        const cropWidth = img.width * 0.65;
        const cropHeight = img.height * 0.70;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageDataUrl;
    });
  };

  const processWithOpenAI = async () => {
    if (!photo) return;
    setLoading(true);
    setError(null);
    console.log('🔍 Iniciando procesamiento...');
    
    try {
      console.log('✂️ Recortando área de texto...');
      const croppedImage = await cropImageToTextArea(photo);
      console.log('📤 Tamaño de imagen:', croppedImage.length, 'bytes');
      
      const apiUrl = import.meta.env.PROD 
        ? 'https://sturdy-acorn-x5pvqpjg9w9whpgrw-3001.app.github.dev'
        : '';
      const endpoint = apiUrl ? `${apiUrl}/api/vision` : '/api/vision';
      
      console.log('🌐 URL del backend:', endpoint);
      console.log('📤 Enviando imagen recortada a backend...');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: croppedImage })
      });
      
      console.log('📡 Respuesta recibida - Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Datos recibidos:', data);
      setResult(data.text || 'Sin resultado');
    } catch (err: any) {
      console.error('💥 Error completo:', err);
      console.error('💥 Error mensaje:', err.message);
      console.error('💥 Error stack:', err.stack);
      setError('Error: ' + (err.message || 'Desconocido'));
    }
    setLoading(false);
  };

  const retakePhoto = () => {
    setPhoto(null);
    setResult('');
    setError(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Escaneo INE con OpenAI Vision</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <canvas ref={canvasRef} width={400} height={300} style={{ display: 'none' }} />
      <video ref={videoRef} width={400} height={300} autoPlay style={{ display: photo ? 'none' : 'block', marginBottom: '10px' }} />
      {!photo ? (
        <div>
          <button onClick={takePhoto} style={{ marginRight: '10px', padding: '10px 20px' }}>📸 Capturar con cámara</button>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="fileInput"
          />
          <label htmlFor="fileInput" style={{ padding: '10px 20px', background: '#667eea', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>
            📁 Subir imagen
          </label>
        </div>
      ) : (
        <div>
          <img src={photo} alt="Captura INE" style={{ maxWidth: '100%', marginBottom: '10px' }} />
          <div>
            <button onClick={processWithOpenAI} disabled={loading} style={{ marginRight: '10px', padding: '10px 20px', background: '#0f0', color: '#000', border: 'none', borderRadius: '5px', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? '⏳ Procesando...' : '✅ Procesar con OpenAI'}
            </button>
            <button onClick={retakePhoto} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              🔄 Reintentar
            </button>
          </div>
          {loading && <div style={{ marginTop: '10px' }}>Procesando...</div>}
          {result && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#e6fff7', borderRadius: '8px' }}>
              <strong>Resultado:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default INEOCRReader;

