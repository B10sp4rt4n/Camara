import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader,
} from "@zxing/library";
import { AUPDebugger } from "../core/aup_debugger";

export default function QRPdf417Reader() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dbg = new AUPDebugger("QRPdf417Reader");

  const [checkingDevices, setCheckingDevices] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const codeReaderRef = useRef<any>(null);
  const [captured, setCaptured] = useState(false);
  const [lastDebug, setLastDebug] = useState<string | null>(null);

  async function getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
      if (
        (BrowserMultiFormatReader as any) &&
        typeof (BrowserMultiFormatReader as any).listVideoInputDevices === "function"
      ) {
        const list = await (BrowserMultiFormatReader as any).listVideoInputDevices();
        return list as MediaDeviceInfo[];
      }
    } catch (e) {
      dbg.log("BrowserMultiFormatReader.listVideoInputDevices failed: " + String(e));
    }

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== "function") {
      throw new Error("Can't enumerate devices, method not supported.");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      dbg.log('getUserMedia attempt failed or denied: ' + String(e));
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput");
  }

  // Stop any running reader and media tracks
  async function stopExistingReader() {
    try {
      if (codeReaderRef.current) {
        try {
          if (typeof codeReaderRef.current.reset === "function") codeReaderRef.current.reset();
          else if (typeof codeReaderRef.current.stopContinuousDecode === "function") codeReaderRef.current.stopContinuousDecode();
          else if (typeof codeReaderRef.current.stop === "function") codeReaderRef.current.stop();
        } catch (e) {
          /* ignore */
        }
        codeReaderRef.current = null;
      }

      const v = videoRef.current;
      if (v && v.srcObject) {
        const s = v.srcObject as MediaStream;
        s.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        try { v.srcObject = null; } catch (e) {}
      }
    } catch (e) {
      dbg.log('stopExistingReader error: ' + String(e));
    }
  }

  async function startCameraWithDevice(deviceId?: string) {
    setCheckingDevices(true);
    try {
      await stopExistingReader();
      const reader = new BrowserMultiFormatReader();
      
      // Configure hints for better detection
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.PDF_417,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.AZTEC,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
      ]);
      (reader as any).hints = hints;
      
      codeReaderRef.current = reader;

      // If deviceId provided, try to use it; otherwise let the browser pick
      await reader.decodeFromVideoDevice(deviceId as any, videoRef.current!, (res: any, err: any) => {
        if (res) {
          const text = res.getText();
          dbg.log('Código detectado: ' + text);
          setResult(text);
          setCaptured(true);
          const beep = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          beep.play().catch(() => {});
          // stop the reader after capture (use any to avoid TS typings mismatch)
          try {
            if ((reader as any) && typeof (reader as any).reset === 'function') (reader as any).reset();
            else if ((reader as any) && typeof (reader as any).stopContinuousDecode === 'function') (reader as any).stopContinuousDecode();
            else if ((reader as any) && typeof (reader as any).stop === 'function') (reader as any).stop();
          } catch (e) {}
        }
        if (err && !(err.name === 'NotFoundException')) {
          dbg.error(err && err.message ? err.message : String(err));
        }
      });
    } catch (err: any) {
      dbg.error('startCameraWithDevice error: ' + (err?.message ?? String(err)));
      setError(err?.message ?? String(err));
    } finally {
      setCheckingDevices(false);
    }
  }

  async function restartCamera() {
    setError(null);
    try {
      await startCameraWithDevice(undefined);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    // start camera on mount
    restartCamera();
    return () => {
      stopExistingReader();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual capture: draw current frame to canvas and try low-level decode
  async function manualCaptureAndDecode() {
    setImgError(null);
    setLastDebug(null);
    try {
      const vid = videoRef.current;
      if (!vid) throw new Error('Video element not ready');
      const w = vid.videoWidth || vid.clientWidth || 640;
      const h = vid.videoHeight || vid.clientHeight || 480;
      setLastDebug(`Capturando frame de ${w}x${h}px...`);
      
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      ctx.drawImage(vid, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Try multiple approaches to decode
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.PDF_417,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.AZTEC,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
      ]);

      // Attempt 1: Normal image
      setLastDebug('Intento 1: imagen normal...');
      try {
        const source = new RGBLuminanceSource(data, w, h);
        const binarizer = new HybridBinarizer(source as any);
        const bitmap = new BinaryBitmap(binarizer as any);
        const readerLow = new MultiFormatReader();
        const res = readerLow.decode(bitmap as any, hints as any);
        if (res) {
          setResult(res.getText());
          setCaptured(true);
          const beep = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          beep.play().catch(() => {});
          await stopExistingReader();
          setLastDebug('✓ Código detectado en intento 1');
          return;
        }
      } catch (e) {
        setLastDebug('Intento 1 falló, probando imagen invertida...');
      }

      // Attempt 2: Inverted colors (for white QR on black background)
      try {
        const invertedData = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i += 4) {
          invertedData[i] = 255 - data[i];     // R
          invertedData[i + 1] = 255 - data[i + 1]; // G
          invertedData[i + 2] = 255 - data[i + 2]; // B
          invertedData[i + 3] = data[i + 3];   // A
        }
        const source2 = new RGBLuminanceSource(invertedData, w, h);
        const binarizer2 = new HybridBinarizer(source2 as any);
        const bitmap2 = new BinaryBitmap(binarizer2 as any);
        const reader2 = new MultiFormatReader();
        const res2 = reader2.decode(bitmap2 as any, hints as any);
        if (res2) {
          setResult(res2.getText());
          setCaptured(true);
          const beep = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          beep.play().catch(() => {});
          await stopExistingReader();
          setLastDebug('✓ Código detectado en intento 2 (invertido)');
          return;
        }
      } catch (e2) {
        const msg = 'No se pudo detectar código en frame actual';
        setImgError(msg);
        setLastDebug(`Intento 2 falló. Asegúrate de que el código esté bien iluminado y centrado en el recuadro verde.`);
        console.warn('manual decode failed both attempts', e2);
      }
    } catch (err: any) {
      setImgError(err?.message ?? String(err));
      setLastDebug(err?.message ?? String(err));
    }
  }

  // Take snapshot from video and download it
  function takeSnapshot() {
    try {
      const vid = videoRef.current;
      if (!vid) {
        alert('Video no está listo');
        return;
      }
      const w = vid.videoWidth || vid.clientWidth || 640;
      const h = vid.videoHeight || vid.clientHeight || 480;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        alert('No se pudo crear canvas');
        return;
      }
      ctx.drawImage(vid, 0, 0, w, h);
      
      // Download the image
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      alert('Error al tomar snapshot: ' + String(err));
    }
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: '100%',
            maxWidth: '600px',
            borderRadius: '10px',
            border: '2px solid #555',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '80%',
            height: '60%',
            border: '3px solid lime',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(0,255,0,0.3)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={manualCaptureAndDecode}>📷 Capturar y decodificar</button>
        <button onClick={takeSnapshot}>💾 Tomar snapshot (descargar foto)</button>
      </div>
      {lastDebug && <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>Debug: {lastDebug}</div>}

      {error && error.includes('enumerate') && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={async () => {
              setError(null);
              setCheckingDevices(true);
              try {
                await getVideoInputDevices();
              } catch (e: any) {
                setError(e?.message ?? String(e));
              } finally {
                setCheckingDevices(false);
              }
            }}
          >
            Intentar pedir permiso de cámara
          </button>
        </div>
      )}

      {result && (
        <p
          style={{
            background: '#e0ffe0',
            padding: '8px',
            borderRadius: '8px',
            marginTop: '10px',
            color: '#222',
          }}
        >
          <strong>Resultado:</strong> {result}
        </p>
      )}

      {captured && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={async () => {
              setCaptured(false);
              setResult(null);
              await restartCamera();
            }}
          >
            Reanudar escaneo
          </button>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>O prueba cargando una imagen con el código:</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={async (e) => {
            setImgError(null);
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            setImgLoading(true);
            try {
              const dataUrl = await new Promise<string>((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(String(r.result));
                r.onerror = rej;
                r.readAsDataURL(f);
              });
              const img = document.createElement('img');
              img.src = dataUrl;
              await new Promise((resolve, reject) => {
                img.onload = () => resolve(true);
                img.onerror = (ev) => reject(new Error('Error loading image'));
              });

              // try to decode using ZXing helper
              const reader = new BrowserMultiFormatReader();
              try {
                let decoded: any = null;
                if (typeof (reader as any).decodeFromImage === 'function') {
                  decoded = await (reader as any).decodeFromImage(img);
                } else if (typeof (reader as any).decodeFromImageElement === 'function') {
                  decoded = await (reader as any).decodeFromImageElement(img);
                }

                if (decoded) {
                  setResult(decoded?.getText ? decoded.getText() : String(decoded));
                } else {
                  // fallback low-level decode with multiple attempts and preprocessing
                  const canvas = document.createElement('canvas');
                  let w = img.naturalWidth || img.width;
                  let h = img.naturalHeight || img.height;
                  
                  // Scale up small images for better detection
                  const minSize = 800;
                  if (w < minSize || h < minSize) {
                    const scale = minSize / Math.min(w, h);
                    w = Math.floor(w * scale);
                    h = Math.floor(h * scale);
                  }
                  
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) throw new Error('No canvas context');
                  ctx.drawImage(img, 0, 0, w, h);
                  
                  // Increase contrast
                  const imageData = ctx.getImageData(0, 0, w, h);
                  const data = imageData.data;
                  
                  // Apply contrast enhancement
                  const contrastFactor = 1.5;
                  for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128));
                    data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128));
                    data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128));
                  }
                  ctx.putImageData(imageData, 0, 0);
                  const enhancedData = ctx.getImageData(0, 0, w, h).data;

                  const hints = new Map();
                  hints.set(DecodeHintType.TRY_HARDER, true);
                  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                    BarcodeFormat.QR_CODE,
                    BarcodeFormat.PDF_417,
                    BarcodeFormat.DATA_MATRIX,
                    BarcodeFormat.AZTEC,
                    BarcodeFormat.CODE_128,
                    BarcodeFormat.CODE_39,
                    BarcodeFormat.EAN_13,
                    BarcodeFormat.EAN_8,
                  ]);

                  // Attempt 1: Enhanced contrast
                  try {
                    const source = new RGBLuminanceSource(enhancedData, w, h);
                    const binarizer = new HybridBinarizer(source as any);
                    const bitmap = new BinaryBitmap(binarizer as any);
                    const readerLow = new MultiFormatReader();
                    const res2 = readerLow.decode(bitmap as any, hints as any);
                    if (res2) {
                      setResult(res2.getText());
                      setImgError('✓ Detectado con mejora de contraste');
                      return;
                    }
                  } catch (e1) {
                    // Attempt 2: Inverted
                    try {
                      const invertedData = new Uint8ClampedArray(enhancedData.length);
                      for (let i = 0; i < enhancedData.length; i += 4) {
                        invertedData[i] = 255 - enhancedData[i];
                        invertedData[i + 1] = 255 - enhancedData[i + 1];
                        invertedData[i + 2] = 255 - enhancedData[i + 2];
                        invertedData[i + 3] = enhancedData[i + 3];
                      }
                      const source2 = new RGBLuminanceSource(invertedData, w, h);
                      const binarizer2 = new HybridBinarizer(source2 as any);
                      const bitmap2 = new BinaryBitmap(binarizer2 as any);
                      const reader2 = new MultiFormatReader();
                      const res3 = reader2.decode(bitmap2 as any, hints as any);
                      if (res3) {
                        setResult(res3.getText());
                        setImgError('✓ Detectado con inversión de colores');
                        return;
                      }
                    } catch (e2) {
                      // Attempt 3: Grayscale with high threshold
                      try {
                        const grayData = new Uint8ClampedArray(enhancedData.length);
                        for (let i = 0; i < enhancedData.length; i += 4) {
                          const gray = 0.299 * enhancedData[i] + 0.587 * enhancedData[i + 1] + 0.114 * enhancedData[i + 2];
                          const threshold = gray > 128 ? 255 : 0;
                          grayData[i] = grayData[i + 1] = grayData[i + 2] = threshold;
                          grayData[i + 3] = enhancedData[i + 3];
                        }
                        const source3 = new RGBLuminanceSource(grayData, w, h);
                        const binarizer3 = new HybridBinarizer(source3 as any);
                        const bitmap3 = new BinaryBitmap(binarizer3 as any);
                        const reader3 = new MultiFormatReader();
                        const res4 = reader3.decode(bitmap3 as any, hints as any);
                        if (res4) {
                          setResult(res4.getText());
                          setImgError('✓ Detectado con binarización');
                          return;
                        }
                      } catch (e3) {
                        const _m = e3 instanceof Error ? e3.message : String(e3);
                        setImgError(_m || 'No se pudo detectar código después de 3 intentos. Intenta con mejor iluminación o más cerca del código.');
                      }
                    }

                  }
                }
              } catch (err: any) {
                setImgError(err?.message ?? String(err));
              }
            } catch (err: any) {
              setImgError(err?.message ?? String(err));
            } finally {
              setImgLoading(false);
            }
          }}
        />
        {imgLoading && <p>Procesando imagen...</p>}
        {imgError && <p style={{ color: 'red' }}>{imgError}</p>}
      </div>
    </div>
  );
}