import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear: () => void;
  label: string;
  value?: string; // Para restaurar assinatura salva
}

export default function SignaturePad({ onSave, onClear, label, value }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Restaurar assinatura se existir
  useEffect(() => {
    if (value && canvasRef.current && isInitialized) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        const img = new Image();
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasSignature(true);
        };
        img.src = value;
      }
    }
  }, [value, isInitialized]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitialized) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Configurar canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    context.strokeStyle = '#000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    setCtx(context);

    // Eventos de mouse
    const handleMouseDown = (e: MouseEvent) => {
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      context.beginPath();
      context.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      context.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      context.stroke();
    };

    const handleMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        setHasSignature(true);
        saveSignature();
      }
    };

    // Eventos de touch
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      context.beginPath();
      context.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      context.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
      context.stroke();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (isDrawing) {
        setIsDrawing(false);
        setHasSignature(true);
        saveSignature();
      }
    };

    // Adicionar event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    setIsInitialized(true);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);

      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isInitialized]); // Removida dependência isDrawing

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className={`border-2 border-dashed rounded-lg p-2 bg-white transition-all duration-200 ${
        hasSignature 
          ? 'border-green-300 bg-green-50' 
          : isDrawing
          ? 'border-blue-300 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}>
        <canvas
          ref={canvasRef}
          className="w-full h-24 cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />
        {hasSignature && (
          <div className="mt-2 text-center">
            <span className="text-xs text-green-600 font-medium">✓ Assinatura salva</span>
          </div>
        )}
        {isDrawing && !hasSignature && (
          <div className="mt-2 text-center">
            <span className="text-xs text-blue-600 font-medium">Desenhando...</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="flex-1"
          disabled={!hasSignature}
        >
          Limpar
        </Button>
      </div>
    </div>
  );
} 