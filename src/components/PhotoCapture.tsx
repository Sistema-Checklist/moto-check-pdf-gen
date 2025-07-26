import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image, X, Trash2, Eye } from 'lucide-react';

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
  const [isViewing, setIsViewing] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraOpen]);

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
        
        // Salvar foto diretamente no checklist
        onPhotoCapture(photoData);
        setIsCameraOpen(false);
      } else {
        console.error('Não foi possível obter o contexto do canvas');
      }
    } else {
      console.error('Video ou canvas não encontrado:', { video: !!videoRef.current, canvas: !!canvasRef.current });
    }
  };

  const selectFromGallery = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Abrindo galeria...');
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Arquivo selecionado:', event.target.files?.[0]);
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        console.log('Foto da galeria carregada, tamanho:', photoData.length);
        onPhotoSelect(photoData);
      };
      reader.readAsDataURL(file);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
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
      <div 
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="relative w-full h-full max-w-2xl max-h-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCameraOpen(false);
              }}
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                capturePhoto();
              }}
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

  if (isViewing && viewingPhoto) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="relative w-full h-full max-w-4xl max-h-4xl p-4">
          <div className="bg-white rounded-lg p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Visualizar {label}</h3>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsViewing(false);
                }}
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
    <div 
      className="space-y-4"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
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
            selectFromGallery(e);
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      viewPhoto(photo);
                    }}
                  />
                  
                  {/* Botões de ação */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          viewPhoto(photo);
                        }}
                        type="button"
                      >
                        <Eye className="h-4 w-4 text-gray-700" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deletePhoto(index);
                        }}
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