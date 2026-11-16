import '@testing-library/jest-dom/vitest';

/**
 * Node 26 exposes an experimental localStorage that is unavailable without a
 * backing file, and it shadows jsdom's storage. Tests get a small in-memory
 * implementation so zustand persist and the demo panel behave like a browser.
 */
class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  try {
    if (!window[name]) {
      Object.defineProperty(window, name, {
        value: new MemoryStorage(),
        configurable: true,
      });
    }
  } catch {
    Object.defineProperty(window, name, {
      value: new MemoryStorage(),
      configurable: true,
    });
  }
}
