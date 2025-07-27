import React from 'react';
import { Label } from '@/components/ui/label';
import PhotoCapture from './PhotoCapture';

interface PhotoSectionProps {
  title: string;
  photos: string[];
  onPhotoCapture: (photoData: string) => void;
  onPhotoSelect: (photoData: string) => void;
  onPhotoDelete: (index: number) => void;
  placeholder: string;
}

export default function PhotoSection({ 
  title, 
  photos, 
  onPhotoCapture, 
  onPhotoSelect, 
  onPhotoDelete,
  placeholder 
}: PhotoSectionProps) {
  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-xl p-6 mb-4 border border-violet-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
        <Label className="text-lg font-semibold text-violet-800">{title}</Label>
      </div>
      
      <PhotoCapture
        onPhotoCapture={onPhotoCapture}
        onPhotoSelect={onPhotoSelect}
        onPhotoDelete={onPhotoDelete}
        photos={photos}
        currentCount={photos.length}
        label={title}
      />
      
      <div className="mt-4">
        <Label className="block mb-2 text-sm font-medium text-gray-700">Observação</Label>
        <textarea 
          className="w-full rounded-lg border border-gray-200 p-3 text-sm bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all duration-200 resize-none" 
          placeholder={placeholder} 
          rows={3}
        />
      </div>
    </div>
  );
} 