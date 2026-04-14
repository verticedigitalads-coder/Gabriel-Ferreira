const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let isWarm = false;

export async function ensureBackendWarm(): Promise<void> {
  if (isWarm) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    await fetch(`${BACKEND_URL}/`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    isWarm = true;
  } catch (err) {
    console.warn('[warmup] Backend não respondeu:', err);
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    isWarm = false;
  }
});
