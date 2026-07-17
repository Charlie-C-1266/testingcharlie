// Shared fakes for the unit suite: in-memory Storage, a stub MediaQueryList,
// and a controllable fetch — so every module can be tested without touching a
// real browser API or the network.

/** A minimal in-memory implementation of the Storage interface. */
export class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

/** A Storage whose every access throws — models Safari private mode. */
export const throwingStorage: Storage = {
  get length(): number {
    throw new Error("storage blocked");
  },
  clear(): void {
    throw new Error("storage blocked");
  },
  getItem(): string | null {
    throw new Error("storage blocked");
  },
  key(): string | null {
    throw new Error("storage blocked");
  },
  removeItem(): void {
    throw new Error("storage blocked");
  },
  setItem(): void {
    throw new Error("storage blocked");
  },
};

/** A stub `(prefers-color-scheme: dark)` query with a fixed `matches`. */
export function fakeMedia(matches: boolean): MediaQueryList {
  return { matches, media: "(prefers-color-scheme: dark)" } as unknown as MediaQueryList;
}

/** Build a fake Response exposing only the fields the GitHub client reads. */
export function jsonResponse<T>(data: T, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async (): Promise<T> => data,
  } as unknown as Response;
}

/** A fetch that returns a fixed response (or one chosen per requested URL). */
export function fakeFetch(response: Response | ((url: string) => Response)): typeof fetch {
  return (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    return typeof response === "function" ? response(url) : response;
  }) as unknown as typeof fetch;
}
