/**
 * Polyfills for Smart TV browsers (Samsung Tizen, LG WebOS)
 * These browsers often run older Chromium/WebKit engines
 */

// Core-js polyfills for missing ES features
import 'core-js/stable/array/from';
import 'core-js/stable/array/find';
import 'core-js/stable/array/find-index';
import 'core-js/stable/array/includes';
import 'core-js/stable/object/assign';
import 'core-js/stable/object/entries';
import 'core-js/stable/object/values';
import 'core-js/stable/promise';
import 'core-js/stable/string/includes';
import 'core-js/stable/string/starts-with';
import 'core-js/stable/string/ends-with';
import 'core-js/stable/set';
import 'core-js/stable/map';
import 'core-js/stable/symbol';
import 'core-js/stable/url';
import 'core-js/stable/url-search-params';

// crypto.randomUUID polyfill (missing in many TV browsers)
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  (crypto as any).randomUUID = function randomUUID(): string {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: string) => {
      const n = Number(c);
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

console.log('[A3 Display] Polyfills loaded for Smart TV compatibility');
