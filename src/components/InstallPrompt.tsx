import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { markInstallPromptDismissed, isIOS as checkIsIOS, isAndroid as checkIsAndroid } from '@/utils/pwa';

interface InstallPromptProps {
  onClose: () => void;
}

export default function InstallPrompt({ onClose }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [showAndroidHelp, setShowAndroidHelp] = useState(false);

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

    // Detectar plataforma
    setIsIOS(checkIsIOS());
    setIsAndroid(checkIsAndroid());

    // Usar prompt global se já tiver sido capturado em main.tsx
    const existing = (window as any).deferredPWAInstallPrompt;
    if (existing) {
      setDeferredPrompt(existing);
    }

    const onDeferredReady = () => {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    };

    // Fallback: também ouvir diretamente (caso o global não esteja disponível)
    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const onAppInstalled = () => {
      try { (window as any).deferredPWAInstallPrompt = null; } catch {}
      onClose();
    };

    window.addEventListener('lovable:deferredprompt-ready', onDeferredReady);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('lovable:deferredprompt-ready', onDeferredReady);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
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
        } else {
          console.log('User dismissed the install prompt');
        }
        // Limpar referência global/local
        (window as any).deferredPWAInstallPrompt = null;
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
    // Mostrar instruções específicas para iOS dentro do modal
    setShowIOSHelp(true);
  };

  const handleAndroidInstall = () => {
    // Exibir instruções quando o prompt nativo não estiver disponível
    setShowAndroidHelp(true);
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

        {/* Ajuda contextual de instalação */}
        {(showIOSHelp || (isIOS && !deferredPrompt)) && (
          <div className="mt-4 p-3 rounded-lg bg-muted/40 text-sm text-muted-foreground text-left space-y-2">
            <p className="font-medium text-foreground">Como instalar no iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Abra no Safari.</li>
              <li>Toque em Compartilhar (ícone quadrado com seta para cima).</li>
              <li>Escolha “Adicionar à Tela Inicial”.</li>
              <li>Confirme em “Adicionar”.</li>
            </ol>
          </div>
        )}

        {(showAndroidHelp || (isAndroid && !deferredPrompt)) && (
          <div className="mt-4 p-3 rounded-lg bg-muted/40 text-sm text-muted-foreground text-left space-y-2">
            <p className="font-medium text-foreground">Como instalar no Android:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Toque no menu ⋮ do navegador.</li>
              <li>Selecione “Instalar app” ou “Adicionar à tela inicial”.</li>
              <li>Confirme em “Instalar/Adicionar”.</li>
            </ol>
          </div>
        )}

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