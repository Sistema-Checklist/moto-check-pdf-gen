import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image, X, PenTool, RotateCcw, Save, Trash2, Eye } from 'lucide-react';

interface PhotoCaptureProps {
  onPhotoCapture: (photoData: string) => void;
  onPhotoSelect: (photoData: string) => void;
  maxPhotos?: number;
  currentCount?: number;
  label?: string;
  photos?: string[];
  onPhotoDelete?: (index: number) => void;
}

export default function PhotoCapture({ 
  onPhotoCapture, 
  onPhotoSelect, 
  maxPhotos = 5, 
  currentCount = 0,
  label = "Foto",
  photos = [],
  onPhotoDelete
}: PhotoCaptureProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Array<{x: number, y: number, type: 'circle' | 'arrow' | 'line', data?: string}>>([]);
  const [drawingMode, setDrawingMode] = useState<'circle' | 'arrow' | 'line'>('circle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState<Array<{x: number, y: number}>>([]);
  const [isViewing, setIsViewing] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraOpen]);

  useEffect(() => {
    if (currentPhoto && annotationCanvasRef.current) {
      const canvas = annotationCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar foto de fundo
        const img = document.createElement('img');
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Redesenhar anotações
          annotations.forEach(annotation => {
            drawAnnotation(ctx, annotation);
          });
        };
        img.src = currentPhoto;
      }
    }
  }, [currentPhoto, annotations]);

  const startCamera = async () => {
    console.log('Iniciando câmera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      console.log('Stream obtido com sucesso:', stream);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Video element configurado');
      } else {
        console.error('Video element não encontrado');
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Erro ao acessar câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    console.log('Tentando capturar foto...');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Foto capturada com sucesso, tamanho:', photoData.length);
        setCurrentPhoto(photoData);
        setIsCameraOpen(false);
        setIsAnnotating(true);
      } else {
        console.error('Não foi possível obter o contexto do canvas');
      }
    } else {
      console.error('Video ou canvas não encontrado:', { video: !!videoRef.current, canvas: !!canvasRef.current });
    }
  };

  const selectFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        setCurrentPhoto(photoData);
        setIsAnnotating(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAnnotating) return;
    
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawingPath([{ x, y }]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isAnnotating) return;
    
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDrawingPath(prev => [...prev, { x, y }]);
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !isAnnotating) return;
    
    setIsDrawing(false);
    
    if (drawingPath.length > 0) {
      const newAnnotation = {
        x: drawingPath[0].x,
        y: drawingPath[0].y,
        type: drawingMode,
        data: drawingMode === 'line' ? JSON.stringify(drawingPath) : undefined
      };
      
      setAnnotations(prev => [...prev, newAnnotation]);
      setDrawingPath([]);
    }
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: any) => {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#ff0000';
    
    switch (annotation.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(annotation.x, annotation.y, 20, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'arrow':
        // Desenhar uma seta simples
        ctx.beginPath();
        ctx.moveTo(annotation.x - 10, annotation.y);
        ctx.lineTo(annotation.x + 10, annotation.y);
        ctx.moveTo(annotation.x + 5, annotation.y - 5);
        ctx.lineTo(annotation.x + 10, annotation.y);
        ctx.lineTo(annotation.x + 5, annotation.y + 5);
        ctx.stroke();
        break;
      case 'line':
        if (annotation.data) {
          const path = JSON.parse(annotation.data);
          if (path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
          }
        }
        break;
    }
  };

  const clearAnnotations = () => {
    setAnnotations([]);
  };

  const saveAnnotatedPhoto = () => {
    console.log('Salvando foto anotada...');
    if (annotationCanvasRef.current && currentPhoto) {
      const canvas = annotationCanvasRef.current;
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Foto anotada salva, tamanho:', photoData.length);
      onPhotoCapture(photoData);
      setIsAnnotating(false);
      setCurrentPhoto(null);
      setAnnotations([]);
    } else {
      console.error('Canvas de anotação ou foto atual não encontrado');
    }
  };

  const cancelAnnotation = () => {
    setIsAnnotating(false);
    setCurrentPhoto(null);
    setAnnotations([]);
  };

  const viewPhoto = (photo: string) => {
    setViewingPhoto(photo);
    setIsViewing(true);
  };

  const deletePhoto = (index: number) => {
    if (onPhotoDelete) {
      onPhotoDelete(index);
    }
  };

  if (currentCount >= maxPhotos) {
    return (
      <div className="text-center text-gray-500 p-4">
        Máximo de {maxPhotos} fotos atingido
      </div>
    );
  }

  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="relative w-full h-full max-w-2xl max-h-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              onClick={() => setIsCameraOpen(false)}
              variant="outline"
              size="sm"
              className="bg-white"
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <Button
              onClick={capturePhoto}
              size="lg"
              className="bg-violet-600 hover:bg-violet-700"
              type="button"
            >
              <Camera className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isAnnotating && currentPhoto) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="relative w-full h-full max-w-4xl max-h-4xl p-4">
          <div className="bg-white rounded-lg p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Editar {label}</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDrawingMode('circle')}
                  className={drawingMode === 'circle' ? 'bg-violet-100' : ''}
                  type="button"
                >
                  <PenTool className="h-4 w-4 mr-1" />
                  Círculo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDrawingMode('arrow')}
                  className={drawingMode === 'arrow' ? 'bg-violet-100' : ''}
                  type="button"
                >
                  Seta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDrawingMode('line')}
                  className={drawingMode === 'line' ? 'bg-violet-100' : ''}
                  type="button"
                >
                  Linha
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAnnotations}
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <canvas
                ref={annotationCanvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="border border-gray-300 cursor-crosshair max-w-full max-h-full"
                style={{ touchAction: 'none' }}
              />
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                onClick={cancelAnnotation}
                variant="outline"
                className="flex-1"
                type="button"
              >
                Cancelar
              </Button>
              <Button
                onClick={saveAnnotatedPhoto}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                type="button"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Foto
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isViewing && viewingPhoto) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="relative w-full h-full max-w-4xl max-h-4xl p-4">
          <div className="bg-white rounded-lg p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Visualizar {label}</h3>
              <Button
                onClick={() => setIsViewing(false)}
                variant="outline"
                size="sm"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto flex items-center justify-center">
              <img
                src={viewingPhoto}
                alt="Foto"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botões de captura */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={(e) => {
            console.log('Botão câmera clicado');
            e.preventDefault();
            e.stopPropagation();
            setIsCameraOpen(true);
          }}
          className="flex flex-col items-center justify-center h-20 bg-gradient-to-br from-violet-50 to-blue-50 border-2 border-dashed border-violet-200 hover:border-violet-300 hover:from-violet-100 hover:to-blue-100 transition-all duration-200"
          disabled={currentCount >= maxPhotos}
          type="button"
        >
          <Camera className="h-6 w-6 text-violet-600 mb-1" />
          <span className="text-sm font-medium text-violet-700">Câmera</span>
          <span className="text-xs text-violet-500">({currentCount}/{maxPhotos})</span>
        </Button>
        <Button
          variant="outline"
          onClick={(e) => {
            console.log('Botão galeria clicado');
            e.preventDefault();
            e.stopPropagation();
            selectFromGallery();
          }}
          className="flex flex-col items-center justify-center h-20 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
          disabled={currentCount >= maxPhotos}
          type="button"
        >
          <Image className="h-6 w-6 text-blue-600 mb-1" />
          <span className="text-sm font-medium text-blue-700">Galeria</span>
          <span className="text-xs text-blue-500">({currentCount}/{maxPhotos})</span>
        </Button>
      </div>

      {/* Visualização das fotos */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Fotos Capturadas:</h4>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-violet-300 transition-colors">
                  <img
                    src={photo}
                    alt={`${label} ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => viewPhoto(photo)}
                  />
                  
                  {/* Botões de ação */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white hover:bg-gray-100"
                        onClick={() => viewPhoto(photo)}
                        type="button"
                      >
                        <Eye className="h-4 w-4 text-gray-700" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600"
                        onClick={() => deletePhoto(index)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Número da foto */}
                  <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
} 