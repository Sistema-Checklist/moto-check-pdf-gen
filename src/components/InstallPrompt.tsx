import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, CheckCircle } from 'lucide-react';
import { markInstallPromptDismissed, isIOS as checkIsIOS, isAndroid as checkIsAndroid } from '@/utils/pwa';

interface InstallPromptProps {
  onClose: () => void;
}

export default function InstallPrompt({ onClose }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Verificar se o app já está instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');

    // Se já estiver instalado, não mostrar o prompt
    if (isInstalled) {
      onClose();
      return;
    }
    // Detect platform
    setIsIOS(checkIsIOS());
    setIsAndroid(checkIsAndroid());

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
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          markInstallPromptDismissed();
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        onClose();
      } catch (error) {
        console.error('Error during installation:', error);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  const handleIOSInstall = () => {
    // Show iOS-specific instructions in a better modal
    const instructions = [
      '1. Toque no botão Compartilhar (□↑) na barra inferior do Safari',
      '2. Role para baixo e toque em "Adicionar à Tela Inicial"',
      '3. Toque em "Adicionar" no canto superior direito',
      '4. O app aparecerá na sua tela inicial como um app nativo!'
    ];
    
    console.log('iOS installation instructions:', instructions);
    markInstallPromptDismissed();
    onClose();
  };

  const handleAndroidInstall = () => {
    // Show Android-specific instructions
    const instructions = [
      '1. Toque no menu (⋮) no canto superior direito do Chrome',
      '2. Toque em "Adicionar à tela inicial" ou "Instalar app"',
      '3. Toque em "Adicionar" na caixa de confirmação',
      '4. O app aparecerá na sua tela inicial!'
    ];
    
    console.log('Android installation instructions:', instructions);
    markInstallPromptDismissed();
    onClose();
  };

  const handleClose = () => {
    markInstallPromptDismissed();
    onClose();
  };

  if (!deferredPrompt && !isIOS && !isAndroid) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-background border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Instale o CheckSystem!
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Adicione o CheckSystem à sua tela inicial para acessar mais rápido e usar como um app nativo.
          </p>
        </div>

        {/* Install buttons */}
        <div className="space-y-3">
          {deferredPrompt && (
            <Button
              onClick={handleInstall}
              className="w-full font-semibold py-3"
            >
              <Download className="h-5 w-5 mr-2" />
              Instalar Agora
            </Button>
          )}

          {isIOS && (
            <Button
              onClick={handleIOSInstall}
              variant="outline"
              className="w-full font-semibold py-3"
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Instalar no iPhone/iPad
            </Button>
          )}

          {isAndroid && !deferredPrompt && (
            <Button
              onClick={handleAndroidInstall}
              variant="outline"
              className="w-full font-semibold py-3"
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Instalar no Android
            </Button>
          )}

          <Button
            onClick={handleClose}
            variant="ghost"
            className="w-full py-2"
          >
            Agora não
          </Button>
        </div>

        {/* Benefits */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>✓ Acesso offline</div>
            <div>✓ Notificações push</div>
            <div>✓ Experiência nativa</div>
            <div>✓ Ícone na tela inicial</div>
          </div>
        </div>
      </div>
    </div>
  );
} 