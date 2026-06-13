import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

// Chunk obsoleto pós-deploy: SW (autoUpdate) apaga chunks antigos enquanto a aba
// ainda referencia hashes antigos → import() rejeita. Recarregar UMA vez resolve.
// sessionStorage persiste no reload mas não na nova aba → guarda anti-loop segura.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('vrtx-chunk-reloaded') === '1') return;
  sessionStorage.setItem('vrtx-chunk-reloaded', '1');
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
