/**
 * Polyfills for Smart TV browsers (Samsung Tizen, LG WebOS)
 * Only safe, non-invasive polyfills that won't conflict with React
 */

// crypto.randomUUID polyfill (missing in many TV browsers)
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  (crypto as any).randomUUID = function randomUUID(): string {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, function (c: string) {
      var n = Number(c);
      return (n ^ ((typeof crypto !== 'undefined' && crypto.getRandomValues
        ? crypto.getRandomValues(new Uint8Array(1))[0]
        : Math.floor(Math.random() * 256)) & (15 >> (n / 4)))).toString(16);
    });
  };
}

// globalThis polyfill
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}

// requestAnimationFrame polyfill (some very old TV browsers)
if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  window.requestAnimationFrame = function (cb: FrameRequestCallback): number {
    return window.setTimeout(function () { cb(Date.now()); }, 16);
  };
  window.cancelAnimationFrame = function (id: number): void {
    window.clearTimeout(id);
  };
}

// IntersectionObserver stub (prevents crashes on TVs without it)
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  (window as any).IntersectionObserver = class IntersectionObserverStub {
    constructor(private callback: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ResizeObserver stub
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  (window as any).ResizeObserver = class ResizeObserverStub {
    constructor(private callback: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
