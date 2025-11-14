const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const Tesseract = require('tesseract.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Habilitar CORS
const cors = require('cors');
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/vision', async (req, res) => {
  const { image } = req.body;
  console.log('📥 Petición recibida');
  
  if (!image) {
    console.log('❌ No se recibió imagen');
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    // Intentar primero con OpenAI Vision
    console.log('🤖 Intentando con OpenAI Vision...');
    const base64Image = image.split(',')[1] || image;
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extrae ÚNICAMENTE el nombre completo de la persona de esta imagen. Devuelve solo el nombre completo sin ningún texto adicional.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 100
      })
    });
    
    if (openaiResponse.ok) {
      const result = await openaiResponse.json();
      const text = result.choices?.[0]?.message?.content;
      
      // Verificar si OpenAI rechazó la petición
      if (text && !text.toLowerCase().includes('no puedo') && !text.toLowerCase().includes('lo siento')) {
        console.log('✅ OpenAI Vision exitoso:', text);
        return res.json({ text, source: 'openai' });
      }
      console.log('⚠️ OpenAI rechazó la petición, usando fallback...');
    }
    
    // Fallback: usar Tesseract OCR
    console.log('🔍 Procesando con Tesseract OCR...');
    const ocrResult = await Tesseract.recognize(image, 'spa');
    
    console.log('📄 Texto completo OCR:', ocrResult.data.text);
    
    // Extraer el nombre completo (entre SEXO y DOMICILIO)
    const textoCompleto = ocrResult.data.text.toUpperCase();
    let nombre = '';
    
    const indiceSEXO = textoCompleto.indexOf('SEXO');
    const indiceDOMICILIO = textoCompleto.indexOf('DOMICIL');
    
    if (indiceSEXO !== -1 && indiceDOMICILIO !== -1 && indiceDOMICILIO > indiceSEXO) {
      // Buscar el final de la palabra SEXO (puede tener H o M después)
      const despuesSEXO = indiceSEXO + 'SEXO'.length;
      
      // Extraer texto DESPUÉS de SEXO hasta DOMICILIO
      const textoEntreMarkers = ocrResult.data.text.substring(despuesSEXO, indiceDOMICILIO);
      
      // Limpiar el texto
      nombre = textoEntreMarkers
        .replace(/\n/g, ' ')      // Quitar saltos de línea
        .replace(/\bH\b/gi, '')   // Quitar "H" (sexo masculino)
        .replace(/\bM\b/gi, '')   // Quitar "M" (sexo femenino)
        .replace(/[<>:;]/g, '')   // Quitar símbolos raros
        .replace(/\bta\b/gi, '')  // Quitar "ta"
        .replace(/\bDOTA\b/gi, '')// Quitar "DOTA"
        .replace(/\bEC\b/gi, '')  // Quitar "EC"
        .replace(/\be\b/gi, '')   // Quitar "e" aisladas
        .replace(/>/g, '')        // Quitar >
        .replace(/\s+/g, ' ')     // Normalizar espacios múltiples
        .trim();
        
      console.log('🎯 NOMBRE COMPLETO extraído (entre SEXO y DOMICILIO):', nombre);
    } else {
      console.log('⚠️ No se encontraron los marcadores SEXO y/o DOMICILIO');
      nombre = 'No se pudo extraer el nombre';
    }
    
    console.log('✅ Tesseract OCR completado - Nombre:', nombre);
    res.json({ text: nombre || 'No se pudo extraer el nombre', source: 'tesseract' });
    
  } catch (err) {
    console.error('💥 Error en /api/vision:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Vision backend running on port ${PORT}`);
});
