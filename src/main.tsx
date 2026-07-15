import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Chunk obsoleto pós-deploy: SW (autoUpdate) apaga chunks antigos enquanto a aba
// ainda referencia hashes antigos → import() rejeita. Recarregar UMA vez resolve.
// sessionStorage persiste no reload mas não na nova aba → guarda anti-loop segura.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('vrtx-chunk-reloaded') === '1') return;
  sessionStorage.setItem('vrtx-chunk-reloaded', '1');
  window.location.reload();
});

// Rotas PÚBLICAS (sem login): o app não tem router, então servimos /termos e
// /privacidade por pathname aqui, antes de montar <App/>. Lazy → react-markdown
// fica num chunk separado, fora do bundle principal.
const PUBLIC_LEGAL_PATHS = ['/termos', '/privacidade'];
const isLegalRoute = PUBLIC_LEGAL_PATHS.includes(window.location.pathname);

const root = createRoot(document.getElementById("root")!);

if (isLegalRoute) {
  const PublicLegalRouter = lazy(() => import("./modules/legal/PublicLegalRouter"));
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <PublicLegalRouter />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
