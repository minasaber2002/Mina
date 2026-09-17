/**
 * Safeguard against "Cannot set property fetch of #<Window> which has only a getter"
 * This ensures that if any runtime environment script, library or extension attempts
 * to wrap or assign window.fetch, it safely succeeds via the configured setter.
 */
try {
  const target = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null);
  if (target) {
    const initialFetch = (target as unknown as { fetch?: typeof fetch }).fetch;
    let currentFetch = typeof initialFetch === 'function' ? initialFetch.bind(target) : initialFetch;

    Object.defineProperty(target, 'fetch', {
      get: () => currentFetch,
      set: (newFetch) => {
        currentFetch = newFetch;
      },
      configurable: true,
      enumerable: true,
    });

    if (typeof Window !== 'undefined' && Window.prototype) {
      try {
        const desc = Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
        if (!desc || !desc.set || !desc.writable) {
          Object.defineProperty(Window.prototype, 'fetch', {
            get: () => currentFetch,
            set: (newFetch) => {
              currentFetch = newFetch;
            },
            configurable: true,
            enumerable: true,
          });
        }
      } catch {
        // Ignore if prototype cannot be modified
      }
    }
  }
} catch {
  // Silent fallback
}

export {};
