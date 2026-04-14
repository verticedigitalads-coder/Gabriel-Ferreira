const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function warmBackend(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    await fetch(`${API_URL}/`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
  } catch {
    // Ignora erro do warmup
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  maxRetries = 2
): Promise<Response> {
  const url = `${API_URL}${path}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...options.headers,
        },
      });
      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        // Provavelmente CORS por cold start — acorda o backend e tenta de novo
        await warmBackend();
        // Aguarda um pouco para o servidor processar
        await new Promise(r => setTimeout(r, 3000));
      } else {
        throw error;
      }
    }
  }

  throw new Error('apiFetch: todas as tentativas falharam');
}
