import { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Type, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  initialValue?: string;
  height?: number;
}

export function SignaturePad({ onSave, initialValue, height = 200 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  useEffect(() => {
    if (!initialValue) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      setHasDrawn(true);
    };
    img.src = initialValue;
  }, [initialValue]);

  const getCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  }, [mode, getCoords]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== 'draw') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, mode, getCoords]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width * 2, rect.height * 2);
    setHasDrawn(false);
    setTypedName('');
  }, []);

  const generateTypedSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !typedName.trim()) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width * 2, rect.height * 2);

    const fontSize = Math.min(40, rect.width / (typedName.length * 0.6));
    ctx.font = `${fontSize}px 'Dancing Script', 'Brush Script MT', 'Segoe Script', cursive`;
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, rect.width / 2, rect.height / 2);
    setHasDrawn(true);
  }, [typedName]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  }, [onSave]);

  const switchToMode = useCallback((newMode: 'draw' | 'type') => {
    setMode(newMode);
    clearCanvas();
  }, [clearCanvas]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchToMode('draw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors min-h-[36px] ${
            mode === 'draw'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          Desenhar
        </button>
        <button
          type="button"
          onClick={() => switchToMode('type')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors min-h-[36px] ${
            mode === 'type'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          Digitar
        </button>
      </div>

      {mode === 'type' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateTypedSignature()}
            placeholder="Digite o nome completo..."
            className="flex-1 p-2 rounded-md bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm min-h-[44px]"
          />
          <button
            type="button"
            onClick={generateTypedSignature}
            disabled={!typedName.trim()}
            className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50 min-h-[44px]"
          >
            Gerar
          </button>
        </div>
      )}

      <div className="relative border-2 border-dashed border-[var(--border)] rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, touchAction: 'none', display: 'block' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && mode === 'draw' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Assine aqui com o dedo ou mouse</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-secondary)] bg-[var(--bg-surface-2)] rounded-md hover:text-[var(--text-primary)] min-h-[36px]"
        >
          <Eraser className="w-3.5 h-3.5" />
          Limpar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasDrawn}
          className="px-4 py-1.5 text-sm font-medium bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50 min-h-[36px]"
        >
          Salvar Assinatura
        </button>
      </div>
    </div>
  );
}
