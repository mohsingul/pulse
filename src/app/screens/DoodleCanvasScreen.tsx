import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { X, Undo, Redo, Trash2, Eraser, Pen } from 'lucide-react';

interface DoodleCanvasScreenProps {
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

const COLORS = ['#000000', '#FB3094', '#A83FFF', '#2571FF', '#FF6B6B', '#4ECDC4', '#FFE66D'];

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

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

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

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold">Doodle Canvas</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4 overflow-hidden relative">
        {/* Gradient background */}
        <div className="absolute inset-4 rounded-3xl bg-[image:var(--pulse-gradient)] opacity-30" />
        <div className="absolute inset-4 rounded-3xl bg-white/80 dark:bg-background/80 backdrop-blur-xl" />
        
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

      {/* Tools */}
      <div className="p-4 border-t border-border space-y-4">
        {/* Tool Selection */}
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => setTool('pen')}
            className={`p-3 rounded-full transition-all ${
              tool === 'pen'
                ? 'bg-[image:var(--pulse-gradient)] text-white shadow-lg'
                : 'bg-accent'
            }`}
          >
            <Pen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-3 rounded-full transition-all ${
              tool === 'eraser'
                ? 'bg-foreground text-background shadow-lg'
                : 'bg-accent'
            }`}
          >
            <Eraser className="w-5 h-5" />
          </button>
          <div className="w-px h-8 bg-border" />
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="p-3 rounded-full bg-accent disabled:opacity-50"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            className="p-3 rounded-full bg-accent disabled:opacity-50"
          >
            <Redo className="w-5 h-5" />
          </button>
          <button
            onClick={handleClear}
            className="p-3 rounded-full bg-destructive/10 text-destructive"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center justify-center space-x-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                color === c ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Line Width */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Thickness</label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-full"
          />
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