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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Configurar canvas com proporção adequada
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const context = canvas.getContext('2d');
    if (!context) return;

    // Escalar o contexto para alta resolução
    context.scale(dpr, dpr);
    
    // Preencher com fundo branco
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);
    
    // Configurar estilo do desenho
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Funções de desenho
    let drawing = false;

    const startDrawing = (x: number, y: number) => {
      drawing = true;
      context.beginPath();
      context.moveTo(x, y);
      setIsDrawing(true);
    };

    const draw = (x: number, y: number) => {
      if (!drawing) return;
      context.lineTo(x, y);
      context.stroke();
      setHasSignature(true);
    };

    const stopDrawing = () => {
      if (!drawing) return;
      drawing = false;
      setIsDrawing(false);
      
      // Salvar automaticamente quando parar de desenhar
      const signatureData = canvas.toDataURL('image/png');
      onSave(signatureData);
    };

    // Eventos de mouse
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      startDrawing(x, y);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      draw(x, y);
    };

    const handleMouseUp = () => {
      stopDrawing();
    };

    // Eventos de touch
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      startDrawing(x, y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      draw(x, y);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    // Adicionar event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);

      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []); // Executar apenas uma vez

  // Restaurar assinatura se existir ou limpar quando ausente
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();

    // Quando houver valor, desenha a assinatura salva
    if (value) {
      const img = new Image();
      img.onload = () => {
        context.clearRect(0, 0, rect.width, rect.height);
        // Fundo branco
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, rect.width, rect.height);
        // Desenha imagem da assinatura
        context.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
        setIsDrawing(false);
      };
      img.src = value;
      return;
    }

    // Quando não houver valor, limpa o canvas e restaura fundo branco
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    setIsDrawing(false);
  }, [value]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    
    // Limpar e recriar fundo branco
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);
    
    setHasSignature(false);
    onClear();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className={`border-2 border-dashed rounded-lg p-4 bg-white transition-all duration-200 ${
        hasSignature 
          ? 'border-green-300 bg-green-50' 
          : isDrawing
          ? 'border-blue-300 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}>
        <canvas
          ref={canvasRef}
          className="w-full h-48 cursor-crosshair touch-none bg-white rounded border border-gray-200"
          style={{ 
            touchAction: 'none',
            width: '100%',
            height: '192px'
          }}
        />
        {!hasSignature && !isDrawing && (
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-500">Toque e arraste para assinar</span>
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