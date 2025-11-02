import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/QRPdf417Reader.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=5936a3cd"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _s = $RefreshSig$();
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=5936a3cd"; const useEffect = __vite__cjsImport3_react["useEffect"]; const useRef = __vite__cjsImport3_react["useRef"]; const useState = __vite__cjsImport3_react["useState"];
import { BrowserMultiFormatReader } from "/node_modules/.vite/deps/@zxing_browser.js?v=269ca580";
import { AUPDebugger } from "/src/core/aup_debugger.ts";
export default function QRPdf417Reader() {
  _s();
  const videoRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const dbg = new AUPDebugger("QRPdf417Reader");
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;
    async function startScan() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setError("No se encontrÃ³ cÃ¡mara.");
          dbg.error("No se encontrÃ³ cÃ¡mara");
          return;
        }
        const device = devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[0];
        await codeReader.decodeFromVideoDevice(
          device.deviceId,
          videoRef.current,
          (res, err) => {
            if (!active) return;
            if (res) {
              const text = res.getText();
              dbg.log("CÃ³digo detectado: " + text);
              setResult(text);
              const beep = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
              beep.play().catch(() => {
              });
            }
            if (err && !(err.name === "NotFoundException")) {
              dbg.error(err.message);
            }
          }
        );
      } catch (err) {
        dbg.error(err.message);
        setError(err.message);
      }
    }
    startScan();
    return () => {
      active = false;
      codeReader.reset();
    };
  }, []);
  return /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center" }, children: [
    /* @__PURE__ */ jsxDEV("h3", { children: "Lector QR / PDF417" }, void 0, false, {
      fileName: "C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx",
      lineNumber: 76,
      columnNumber: 7
    }, this),
    error && /* @__PURE__ */ jsxDEV("p", { style: { color: "red" }, children: error }, void 0, false, {
      fileName: "C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx",
      lineNumber: 77,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV("div", { style: { position: "relative", display: "inline-block" }, children: [
      /* @__PURE__ */ jsxDEV(
        "video",
        {
          ref: videoRef,
          autoPlay: true,
          playsInline: true,
          muted: true,
          style: {
            width: "100%",
            maxWidth: "600px",
            borderRadius: "10px",
            border: "2px solid #555"
          }
        },
        void 0,
        false,
        {
          fileName: "C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx",
          lineNumber: 79,
          columnNumber: 9
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          style: {
            position: "absolute",
            top: "20%",
            left: "10%",
            width: "80%",
            height: "60%",
            border: "3px solid lime",
            borderRadius: "12px",
            boxShadow: "0 0 20px rgba(0,255,0,0.3)",
            pointerEvents: "none"
          }
        },
        void 0,
        false,
        {
          fileName: "C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx",
          lineNumber: 91,
          columnNumber: 9
        },
        this
      )
    ] }, void 0, true, {
      fileName: "C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx",
      lineNumber: 78,
      columnNumber: 7
    }, this),
    result && /* @__PURE__ */ jsxDEV(
      "p",
      {
        style: {
          background: "#e0ffe0",
          padding: "8px",
          borderRadius: "8px",
          marginTop: "10px",
          color: "#222"
        },
        children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "Resultado:" }, void 0, false, {
            fileName: "C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx",
            lineNumber: 115,
            columnNumber: 11
          }, this),
          " ",
          result
        ]
      },
      void 0,
      true,
      {
        fileName: "C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx",
        lineNumber: 106,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, true, {
    fileName: "C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx",
    lineNumber: 75,
    columnNumber: 5
  }, this);
}
_s(QRPdf417Reader, "aoZDwoCshOH+LfQvSLwhf+HrYIg=");
_c = QRPdf417Reader;
var _c;
$RefreshReg$(_c, "QRPdf417Reader");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/salva/Documents/AUP_Fact/AUP_access/src/components/QRPdf417Reader.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,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QVE7QUFBQSxZQUNSRCxjQUFjO0FBQUEsWUFDZEssV0FBVztBQUFBLFlBQ1hDLGVBQWU7QUFBQSxVQUNqQjtBQUFBO0FBQUEsUUFYRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFZQztBQUFBLFNBekJIO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0EwQkE7QUFBQSxJQUNDM0MsVUFDQztBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsT0FBTztBQUFBLFVBQ0w0QyxZQUFZO0FBQUEsVUFDWkMsU0FBUztBQUFBLFVBQ1RSLGNBQWM7QUFBQSxVQUNkUyxXQUFXO0FBQUEsVUFDWGQsT0FBTztBQUFBLFFBQ1Q7QUFBQSxRQUVBO0FBQUEsaUNBQUMsWUFBTywwQkFBUjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFrQjtBQUFBLFVBQVM7QUFBQSxVQUFFaEM7QUFBQUE7QUFBQUE7QUFBQUEsTUFUL0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBVUE7QUFBQSxPQXpDSjtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBMkNBO0FBRUo7QUFBQ0YsR0FoR3VCRCxnQkFBYztBQUFBa0QsS0FBZGxEO0FBQWMsSUFBQWtEO0FBQUFDLGFBQUFELElBQUEiLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VSZWYiLCJ1c2VTdGF0ZSIsIkJyb3dzZXJNdWx0aUZvcm1hdFJlYWRlciIsIkFVUERlYnVnZ2VyIiwiUVJQZGY0MTdSZWFkZXIiLCJfcyIsInZpZGVvUmVmIiwicmVzdWx0Iiwic2V0UmVzdWx0IiwiZXJyb3IiLCJzZXRFcnJvciIsImRiZyIsImNvZGVSZWFkZXIiLCJhY3RpdmUiLCJzdGFydFNjYW4iLCJkZXZpY2VzIiwibGlzdFZpZGVvSW5wdXREZXZpY2VzIiwibGVuZ3RoIiwiZGV2aWNlIiwiZmluZCIsImQiLCJ0ZXN0IiwibGFiZWwiLCJkZWNvZGVGcm9tVmlkZW9EZXZpY2UiLCJkZXZpY2VJZCIsImN1cnJlbnQiLCJyZXMiLCJlcnIiLCJ0ZXh0IiwiZ2V0VGV4dCIsImxvZyIsImJlZXAiLCJBdWRpbyIsInBsYXkiLCJjYXRjaCIsIm5hbWUiLCJtZXNzYWdlIiwicmVzZXQiLCJ0ZXh0QWxpZ24iLCJjb2xvciIsInBvc2l0aW9uIiwiZGlzcGxheSIsIndpZHRoIiwibWF4V2lkdGgiLCJib3JkZXJSYWRpdXMiLCJib3JkZXIiLCJ0b3AiLCJsZWZ0IiwiaGVpZ2h0IiwiYm94U2hhZG93IiwicG9pbnRlckV2ZW50cyIsImJhY2tncm91bmQiLCJwYWRkaW5nIiwibWFyZ2luVG9wIiwiX2MiLCIkUmVmcmVzaFJlZyQiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiUVJQZGY0MTdSZWFkZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgQnJvd3Nlck11bHRpRm9ybWF0UmVhZGVyIH0gZnJvbSBcIkB6eGluZy9icm93c2VyXCI7XG5pbXBvcnQgeyBBVVBEZWJ1Z2dlciB9IGZyb20gXCIuLi9jb3JlL2F1cF9kZWJ1Z2dlclwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBRUlBkZjQxN1JlYWRlcigpIHtcbiAgY29uc3QgdmlkZW9SZWYgPSB1c2VSZWY8SFRNTFZpZGVvRWxlbWVudD4obnVsbCk7XG4gIGNvbnN0IFtyZXN1bHQsIHNldFJlc3VsdF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgZGJnID0gbmV3IEFVUERlYnVnZ2VyKFwiUVJQZGY0MTdSZWFkZXJcIik7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBjb2RlUmVhZGVyID0gbmV3IEJyb3dzZXJNdWx0aUZvcm1hdFJlYWRlcigpO1xuICAgIGxldCBhY3RpdmUgPSB0cnVlO1xuXG4gICAgYXN5bmMgZnVuY3Rpb24gc3RhcnRTY2FuKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZGV2aWNlcyA9IGF3YWl0IEJyb3dzZXJNdWx0aUZvcm1hdFJlYWRlci5saXN0VmlkZW9JbnB1dERldmljZXMoKTtcbiAgICAgICAgaWYgKGRldmljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc2V0RXJyb3IoXCJObyBzZSBlbmNvbnRyw7MgY8OhbWFyYS5cIik7XG4gICAgICAgICAgZGJnLmVycm9yKFwiTm8gc2UgZW5jb250csOzIGPDoW1hcmFcIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRldmljZSA9XG4gICAgICAgICAgZGV2aWNlcy5maW5kKChkKSA9PiAvYmFja3xyZWFyfGVudmlyb25tZW50L2kudGVzdChkLmxhYmVsKSkgfHwgZGV2aWNlc1swXTtcbiAgICAgICAgYXdhaXQgY29kZVJlYWRlci5kZWNvZGVGcm9tVmlkZW9EZXZpY2UoXG4gICAgICAgICAgZGV2aWNlLmRldmljZUlkLFxuICAgICAgICAgIHZpZGVvUmVmLmN1cnJlbnQhLFxuICAgICAgICAgIChyZXMsIGVycikgPT4ge1xuICAgICAgICAgICAgaWYgKCFhY3RpdmUpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IHJlcy5nZXRUZXh0KCk7XG4gICAgICAgICAgICAgIGRiZy5sb2coXCJDw7NkaWdvIGRldGVjdGFkbzogXCIgKyB0ZXh0KTtcbiAgICAgICAgICAgICAgc2V0UmVzdWx0KHRleHQpO1xuICAgICAgICAgICAgICBjb25zdCBiZWVwID0gbmV3IEF1ZGlvKFwiaHR0cHM6Ly9hY3Rpb25zLmdvb2dsZS5jb20vc291bmRzL3YxL2FsYXJtcy9iZWVwX3Nob3J0Lm9nZ1wiKTtcbiAgICAgICAgICAgICAgYmVlcC5wbGF5KCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVyciAmJiAhKGVyci5uYW1lID09PSBcIk5vdEZvdW5kRXhjZXB0aW9uXCIpKSB7XG4gICAgICAgICAgICAgIGRiZy5lcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgZGJnLmVycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgICAgc2V0RXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHN0YXJ0U2NhbigpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBhY3RpdmUgPSBmYWxzZTtcbiAgICAgIGNvZGVSZWFkZXIucmVzZXQoKTtcbiAgICB9O1xuICB9LCBbXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IHRleHRBbGlnbjogXCJjZW50ZXJcIiB9fT5cbiAgICAgIDxoMz5MZWN0b3IgUVIgLyBQREY0MTc8L2gzPlxuICAgICAge2Vycm9yICYmIDxwIHN0eWxlPXt7IGNvbG9yOiBcInJlZFwiIH19PntlcnJvcn08L3A+fVxuICAgICAgPGRpdiBzdHlsZT17eyBwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLCBkaXNwbGF5OiBcImlubGluZS1ibG9ja1wiIH19PlxuICAgICAgICA8dmlkZW9cbiAgICAgICAgICByZWY9e3ZpZGVvUmVmfVxuICAgICAgICAgIGF1dG9QbGF5XG4gICAgICAgICAgcGxheXNJbmxpbmVcbiAgICAgICAgICBtdXRlZFxuICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICAgICAgICBtYXhXaWR0aDogXCI2MDBweFwiLFxuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEwcHhcIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIycHggc29saWQgIzU1NVwiXG4gICAgICAgICAgfX1cbiAgICAgICAgLz5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICBwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuICAgICAgICAgICAgdG9wOiBcIjIwJVwiLFxuICAgICAgICAgICAgbGVmdDogXCIxMCVcIixcbiAgICAgICAgICAgIHdpZHRoOiBcIjgwJVwiLFxuICAgICAgICAgICAgaGVpZ2h0OiBcIjYwJVwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjNweCBzb2xpZCBsaW1lXCIsXG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgICAgICAgYm94U2hhZG93OiBcIjAgMCAyMHB4IHJnYmEoMCwyNTUsMCwwLjMpXCIsXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiBcIm5vbmVcIlxuICAgICAgICAgIH19XG4gICAgICAgID48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Jlc3VsdCAmJiAoXG4gICAgICAgIDxwXG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IFwiI2UwZmZlMFwiLFxuICAgICAgICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgICAgICAgIG1hcmdpblRvcDogXCIxMHB4XCIsXG4gICAgICAgICAgICBjb2xvcjogXCIjMjIyXCJcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAgPHN0cm9uZz5SZXN1bHRhZG86PC9zdHJvbmc+IHtyZXN1bHR9XG4gICAgICAgIDwvcD5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59Il0sImZpbGUiOiJDOi9Vc2Vycy9zYWx2YS9Eb2N1bWVudHMvQVVQX0ZhY3QvQVVQX2FjY2Vzcy9zcmMvY29tcG9uZW50cy9RUlBkZjQxN1JlYWRlci50c3gifQ==
