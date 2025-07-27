// PWA Utilities
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

export const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

export const canInstallPWA = (): boolean => {
  return !isPWAInstalled() && isMobileDevice();
};

// Storage para controlar quando mostrar o prompt
const INSTALL_PROMPT_DISMISSED_KEY = 'pwa-install-prompt-dismissed';
const INSTALL_PROMPT_SHOWN_KEY = 'pwa-install-prompt-shown';

export const wasInstallPromptDismissed = (): boolean => {
  return localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === 'true';
};

export const markInstallPromptDismissed = (): void => {
  localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
};

export const wasInstallPromptShown = (): boolean => {
  return localStorage.getItem(INSTALL_PROMPT_SHOWN_KEY) === 'true';
};

export const markInstallPromptShown = (): void => {
  localStorage.setItem(INSTALL_PROMPT_SHOWN_KEY, 'true');
};

export const resetInstallPromptState = (): void => {
  localStorage.removeItem(INSTALL_PROMPT_DISMISSED_KEY);
  localStorage.removeItem(INSTALL_PROMPT_SHOWN_KEY);
};