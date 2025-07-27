// PWA Utilities
export const isPWAInstalled = (): boolean => {
  // Verificações mais robustas para detecção de instalação
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const isWebAPK = document.referrer.includes('android-app://');
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  
  const installed = isStandalone || isIOSStandalone || isWebAPK || isFullscreen || isMinimalUI;
  
  console.log('PWA Installation Check:', {
    isStandalone,
    isIOSStandalone,
    isWebAPK,
    isFullscreen,
    isMinimalUI,
    installed,
    userAgent: navigator.userAgent
  });
  
  return installed;
};

export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent;
  const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent);
  const isSmallScreen = window.innerWidth <= 768;
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  const isMobile = isMobileUA || (isSmallScreen && hasTouchScreen);
  
  console.log('Mobile Device Check:', {
    userAgent,
    isMobileUA,
    isSmallScreen,
    hasTouchScreen,
    isMobile,
    innerWidth: window.innerWidth
  });
  
  return isMobile;
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

export const canInstallPWA = (): boolean => {
  const installed = isPWAInstalled();
  const mobile = isMobileDevice();
  const dismissed = wasInstallPromptDismissed();
  
  const canInstall = !installed && mobile && !dismissed;
  
  console.log('Can Install PWA Check:', {
    installed,
    mobile,
    dismissed,
    canInstall
  });
  
  return canInstall;
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