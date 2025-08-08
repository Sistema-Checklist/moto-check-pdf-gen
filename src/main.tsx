import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Capture the PWA install prompt as early as possible
window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault();
  (window as any).deferredPWAInstallPrompt = e;
  // Notify any listeners that the prompt is ready
  window.dispatchEvent(new Event('lovable:deferredprompt-ready'));
});

// Optional: log when app gets installed and clear stored prompt
window.addEventListener('appinstalled', () => {
  try { (window as any).deferredPWAInstallPrompt = null; } catch {}
  console.log('PWA installed');
});

createRoot(document.getElementById("root")!).render(<App />);
