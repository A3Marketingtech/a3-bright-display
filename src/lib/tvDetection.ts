/**
 * Smart TV Detection & Adaptive Quality
 * Detects Samsung Tizen, LG WebOS, and other TV browsers
 * Adjusts media quality based on device capabilities
 */

export type TVPlatform = 'tizen' | 'webos' | 'android-tv' | 'fire-tv' | 'unknown-tv' | 'desktop';

export interface TVCapabilities {
  platform: TVPlatform;
  isTV: boolean;
  maxVideoResolution: '480p' | '720p' | '1080p' | '4k';
  maxImageWidth: number;
  supportsBackdropFilter: boolean;
  supportsWebP: boolean;
  reducedAnimations: boolean;
  tizenVersion: number | null;
  webosVersion: number | null;
}

function detectPlatform(): TVPlatform {
  if (typeof navigator === 'undefined') return 'desktop';

  var ua = navigator.userAgent || '';

  // Samsung Tizen
  if (ua.indexOf('Tizen') !== -1 || ua.indexOf('SMART-TV') !== -1 || typeof (window as any).tizen !== 'undefined') {
    return 'tizen';
  }

  // LG WebOS
  if (ua.indexOf('Web0S') !== -1 || ua.indexOf('WebOS') !== -1 || ua.indexOf('webOS') !== -1 || typeof (window as any).webOS !== 'undefined') {
    return 'webos';
  }

  // Android TV
  if (ua.indexOf('Android') !== -1 && (ua.indexOf('TV') !== -1 || ua.indexOf('AFT') !== -1 || ua.indexOf('BRAVIA') !== -1)) {
    return 'android-tv';
  }

  // Amazon Fire TV
  if (ua.indexOf('AFTS') !== -1 || ua.indexOf('AFTM') !== -1 || ua.indexOf('Fire TV') !== -1) {
    return 'fire-tv';
  }

  // Generic TV detection
  if (ua.indexOf('TV') !== -1 || ua.indexOf('SmartTV') !== -1 || ua.indexOf('HbbTV') !== -1) {
    return 'unknown-tv';
  }

  return 'desktop';
}

function getTizenVersion(): number | null {
  if (typeof navigator === 'undefined') return null;
  var match = navigator.userAgent.match(/Tizen\s*(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function getWebOSVersion(): number | null {
  if (typeof navigator === 'undefined') return null;
  var match = navigator.userAgent.match(/Web0S(?:\.TV)?[\s/]*(\d+\.?\d*)/i);
  if (!match) match = navigator.userAgent.match(/Chrome\/(\d+)/);
  return match ? parseFloat(match[1]) : null;
}

function checkWebPSupport(): boolean {
  if (typeof document === 'undefined') return true;
  var canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

function checkBackdropFilter(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
}

function determineMaxResolution(platform: TVPlatform, tizenVer: number | null, webosVer: number | null): TVCapabilities['maxVideoResolution'] {
  switch (platform) {
    case 'tizen':
      if (tizenVer && tizenVer >= 5) return '4k';
      if (tizenVer && tizenVer >= 3) return '1080p';
      return '720p';
    case 'webos':
      if (webosVer && webosVer >= 4) return '4k';
      if (webosVer && webosVer >= 3) return '1080p';
      return '720p';
    case 'android-tv':
    case 'fire-tv':
      return '1080p';
    case 'unknown-tv':
      return '720p';
    default:
      return '4k';
  }
}

function determineMaxImageWidth(maxRes: TVCapabilities['maxVideoResolution']): number {
  switch (maxRes) {
    case '480p': return 854;
    case '720p': return 1280;
    case '1080p': return 1920;
    case '4k': return 3840;
    default: return 1920;
  }
}

let cachedCapabilities: TVCapabilities | null = null;

export function detectTV(): TVCapabilities {
  if (cachedCapabilities) return cachedCapabilities;

  var platform = detectPlatform();
  var tizenVersion = getTizenVersion();
  var webosVersion = getWebOSVersion();
  var maxVideoResolution = determineMaxResolution(platform, tizenVersion, webosVersion);
  var isTV = platform !== 'desktop';

  cachedCapabilities = {
    platform: platform,
    isTV: isTV,
    maxVideoResolution: maxVideoResolution,
    maxImageWidth: determineMaxImageWidth(maxVideoResolution),
    supportsBackdropFilter: checkBackdropFilter(),
    supportsWebP: checkWebPSupport(),
    reducedAnimations: isTV,
    tizenVersion: tizenVersion,
    webosVersion: webosVersion,
  };

  console.log('[A3 Display] TV Detection:', cachedCapabilities);

  return cachedCapabilities;
}

/**
 * Get optimized image URL based on TV capabilities
 * For Google Drive images, adjusts the thumbnail size parameter
 */
export function getOptimizedImageUrl(url: string, capabilities: TVCapabilities): string {
  var maxW = capabilities.maxImageWidth;

  // Google Drive thumbnail - adjust size
  if (url.indexOf('drive.google.com/thumbnail') !== -1) {
    return url.replace(/sz=w\d+/, 'sz=w' + maxW);
  }

  // For other URLs, return as-is (can't resize server-side)
  return url;
}

/**
 * Get CSS class adjustments for TV
 */
export function getTVStyles(capabilities: TVCapabilities): React.CSSProperties {
  var styles: React.CSSProperties = {};

  if (!capabilities.supportsBackdropFilter) {
    // Use solid background fallback instead of backdrop-blur
    styles.backgroundColor = 'rgba(10, 10, 10, 0.95)';
  }

  return styles;
}
