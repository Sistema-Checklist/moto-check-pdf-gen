import React from 'react';
import { Label } from '@/components/ui/label';
import PhotoCapture from './PhotoCapture';

interface PhotoSectionProps {
  title: string;
  photos: string[];
  onPhotoCapture: (photoData: string) => void;
  onPhotoSelect: (photoData: string) => void;
  placeholder: string;
}

export default function PhotoSection({ 
  title, 
  photos, 
  onPhotoCapture, 
  onPhotoSelect, 
  placeholder 
}: PhotoSectionProps) {
  return (
    <div className="bg-blue-50 rounded p-4 mb-2">
      <Label className="mb-1 block">{title}</Label>
      <PhotoCapture
        onPhotoCapture={onPhotoCapture}
        onPhotoSelect={onPhotoSelect}
        currentCount={photos.length}
        label={title}
      />
      <div>
        <Label className="block mb-1">Observação</Label>
        <textarea 
          className="w-full rounded border p-2 text-sm" 
          placeholder={placeholder} 
          rows={2}
        />
      </div>
    </div>
  );
} 