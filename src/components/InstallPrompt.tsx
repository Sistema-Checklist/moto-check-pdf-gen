import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface InstallPromptProps {
  onClose: () => void;
}

export default function InstallPrompt({ onClose }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for beforeinstallprompt event
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
      onClose();
    }
  };

  const handleIOSInstall = () => {
    // Show iOS-specific instructions
    alert(
      'Para instalar o CheckSystem no iPhone/iPad:\n\n' +
      '1. Toque no botão Compartilhar (□↑)\n' +
      '2. Role para baixo e toque em "Adicionar à Tela Inicial"\n' +
      '3. Toque em "Adicionar"\n\n' +
      'O app aparecerá na sua tela inicial!'
    );
    onClose();
  };

  const handleAndroidInstall = () => {
    // Show Android-specific instructions
    alert(
      'Para instalar o CheckSystem no Android:\n\n' +
      '1. Toque no menu (⋮) no Chrome\n' +
      '2. Toque em "Adicionar à tela inicial"\n' +
      '3. Toque em "Adicionar"\n\n' +
      'O app aparecerá na sua tela inicial!'
    );
    onClose();
  };

  if (!deferredPrompt && !isIOS && !isAndroid) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-violet-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Instale o CheckSystem!
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Adicione o CheckSystem à sua tela inicial para acessar mais rápido e usar como um app nativo.
          </p>
        </div>

        {/* Install buttons */}
        <div className="space-y-3">
          {deferredPrompt && (
            <Button
              onClick={handleInstall}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3"
            >
              <Download className="h-5 w-5 mr-2" />
              Instalar Agora
            </Button>
          )}

          {isIOS && (
            <Button
              onClick={handleIOSInstall}
              variant="outline"
              className="w-full border-violet-200 text-violet-700 hover:bg-violet-50 font-semibold py-3"
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Instalar no iPhone/iPad
            </Button>
          )}

          {isAndroid && !deferredPrompt && (
            <Button
              onClick={handleAndroidInstall}
              variant="outline"
              className="w-full border-violet-200 text-violet-700 hover:bg-violet-50 font-semibold py-3"
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Instalar no Android
            </Button>
          )}

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-700 py-2"
          >
            Agora não
          </Button>
        </div>

        {/* Benefits */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <div>✓ Acesso offline</div>
            <div>✓ Notificações push</div>
            <div>✓ Experiência nativa</div>
          </div>
        </div>
      </div>
    </div>
  );
} 