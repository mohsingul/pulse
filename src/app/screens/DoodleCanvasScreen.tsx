import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { X, Undo, Redo, Trash2, Eraser, Pen } from 'lucide-react';

interface DoodleCanvasScreenProps {
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

const COLOR_PALETTE = {
  warm: ['#FF6B6B', '#FF8E53', '#FFB627', '#FFA07A', '#FF69B4', '#FF1493'],
  cool: ['#2571FF', '#4ECDC4', '#45B7D1', '#96CEB4', '#A8E6CF', '#00CED1'],
  neutral: ['#000000', '#4A4A4A', '#8B8B8B', '#C0C0C0', '#E8E8E8', '#FFFFFF'],
  vibrant: ['#FB3094', '#A83FFF', '#FF0080', '#00D9FF', '#FFE66D', '#7FFF00'],
};

const ALL_COLORS = [
  ...COLOR_PALETTE.vibrant,
  ...COLOR_PALETTE.warm,
  ...COLOR_PALETTE.cool,
  ...COLOR_PALETTE.neutral,
];

export function DoodleCanvasScreen({ onClose, onSave }: DoodleCanvasScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - make it much larger for better drawing experience
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Don't fill with white - leave transparent for gradient background
    // Just save initial state
    saveToHistory();
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Begin a new path to prevent connecting lines
    ctx.beginPath();
    
    // Get coordinates and move to starting position
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    x *= scaleX;
    y *= scaleY;

    // Move to the starting point without drawing
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // End the current path
      ctx.closePath();
      saveToHistory();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling on touch
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    // Scale coordinates for high DPI displays
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    x *= scaleX;
    y *= scaleY;

    ctx.lineWidth = lineWidth * scaleX;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = history[historyStep - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryStep(historyStep - 1);
      };
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = history[historyStep + 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryStep(historyStep + 1);
      };
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear to transparent instead of white
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Save with transparency - no white background
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold">Doodle Canvas</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas - Maximized */}
      <div className="flex-1 p-2 overflow-hidden relative">
        {/* Gradient background */}
        <div className="absolute inset-2 rounded-3xl bg-[image:var(--pulse-gradient)] opacity-30" />
        <div className="absolute inset-2 rounded-3xl bg-white/80 dark:bg-background/80 backdrop-blur-xl" />
        
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="relative w-full h-full rounded-3xl shadow-2xl touch-none"
        />
      </div>

      {/* Tools - Compact */}
      <div className="px-4 py-3 border-t border-border space-y-3">
        {/* Tool Selection - Single Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Drawing Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-2.5 rounded-full transition-all ${
                tool === 'pen'
                  ? 'bg-[image:var(--pulse-gradient)] text-white shadow-lg'
                  : 'bg-accent'
              }`}
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2.5 rounded-full transition-all ${
                tool === 'eraser'
                  ? 'bg-foreground text-background shadow-lg'
                  : 'bg-accent'
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* History Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyStep <= 0}
              className="p-2.5 rounded-full bg-accent disabled:opacity-50"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
              className="p-2.5 rounded-full bg-accent disabled:opacity-50"
            >
              <Redo className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-2.5 rounded-full bg-destructive/10 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Colors - Compact Horizontal Scroll */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Colors:</span>
          <div className="flex gap-2">
            {ALL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex-shrink-0 ${
                  color === c ? 'border-foreground scale-110 shadow-lg' : 'border-border'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Line Width - Compact */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium whitespace-nowrap">Thickness:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-6 text-right">{lineWidth}</span>
        </div>

        {/* Save Button */}
        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={handleSave}
        >
          Save Doodle
        </Button>
      </div>
    </div>
  );
}