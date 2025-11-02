# 📷 Lector QR/PDF417 con Cámara

Aplicación web para leer códigos QR y PDF417 usando la cámara del dispositivo.

## 🚀 Demo en vivo

**URL:** https://b10sp4rt4n.github.io/Camara/

⚠️ **Importante:** Usa **Chrome o Edge** y permite el acceso a la cámara cuando te lo pida.

## ✨ Características

- 📸 Escaneo en tiempo real con la cámara
- 🔍 Soporta múltiples formatos: QR Code, PDF417, Data Matrix, Aztec, Code 128, Code 39
- 📊 Log de debug en tiempo real
- 🎯 Detección automática y rápida
- 🌐 Funciona en navegadores modernos

## 🛠️ Desarrollo local

### Requisitos
- Node.js 18+
- npm

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/B10sp4rt4n/Camara.git
cd Camara

# Instalar dependencias
npm install

# Correr en modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://127.0.0.1:5191/`

⚠️ **Nota:** Usa `127.0.0.1` en lugar de `localhost` para que la cámara funcione correctamente.

## 📦 Build para producción

```bash
npm run build
```

Los archivos listos para producción estarán en la carpeta `dist/`.

## 🔧 Tecnologías

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool y dev server
- **@zxing/browser** - Librería de lectura de códigos
- **GitHub Pages** - Hosting

## 📝 Uso

1. Abre la aplicación en Chrome o Edge
2. Permite el acceso a la cámara cuando se te solicite
3. Presenta un código QR o PDF417 frente a la cámara
4. El resultado se mostrará automáticamente

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto.

## 👤 Autor

**B10sp4rt4n**
- GitHub: [@B10sp4rt4n](https://github.com/B10sp4rt4n)
