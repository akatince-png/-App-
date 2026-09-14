import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWithCache, invalidateCache, _clearCacheForTests } from "./queryCache";

describe("fetchWithCache", () => {
  beforeEach(() => _clearCacheForTests());

  it("ruft den fetcher beim ersten Mal auf und liefert dessen Ergebnis", async () => {
    const fetcher = vi.fn().mockResolvedValue("erstes-ergebnis");
    const ergebnis = await fetchWithCache("k1", fetcher);
    expect(ergebnis).toBe("erstes-ergebnis");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("liefert innerhalb der TTL den gecachten Wert, ohne den fetcher erneut aufzurufen", async () => {
    const fetcher = vi.fn().mockResolvedValue("wert");
    await fetchWithCache("k2", fetcher, { ttlMs: 10000 });
    await fetchWithCache("k2", fetcher, { ttlMs: 10000 });
    await fetchWithCache("k2", fetcher, { ttlMs: 10000 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("lädt nach Ablauf der TTL erneut", async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn().mockResolvedValue("wert");
      await fetchWithCache("k3", fetcher, { ttlMs: 1000 });
      vi.advanceTimersByTime(1500);
      await fetchWithCache("k3", fetcher, { ttlMs: 1000 });
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("teilt sich eine gleichzeitig laufende Anfrage für denselben Key (Dedup)", async () => {
    let aufloesen;
    const fetcher = vi.fn(() => new Promise((resolve) => (aufloesen = resolve)));
    const p1 = fetchWithCache("k4", fetcher);
    const p2 = fetchWithCache("k4", fetcher);
    aufloesen("geteilter-wert");
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe("geteilter-wert");
    expect(r2).toBe("geteilter-wert");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("cacht Fehler nicht — der nächste Aufruf versucht es erneut", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("kaputt")).mockResolvedValueOnce("erholt");
    await expect(fetchWithCache("k5", fetcher)).rejects.toThrow("kaputt");
    const ergebnis = await fetchWithCache("k5", fetcher);
    expect(ergebnis).toBe("erholt");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("verschiedene Keys werden unabhängig voneinander gecacht", async () => {
    const fetcherA = vi.fn().mockResolvedValue("a");
    const fetcherB = vi.fn().mockResolvedValue("b");
    expect(await fetchWithCache("k6a", fetcherA)).toBe("a");
    expect(await fetchWithCache("k6b", fetcherB)).toBe("b");
    expect(fetcherA).toHaveBeenCalledTimes(1);
    expect(fetcherB).toHaveBeenCalledTimes(1);
  });
});

describe("invalidateCache", () => {
  beforeEach(() => _clearCacheForTests());

  it("verwirft den gecachten Wert — der nächste Aufruf lädt neu", async () => {
    const fetcher = vi.fn().mockResolvedValue("wert");
    await fetchWithCache("k7", fetcher, { ttlMs: 60000 });
    invalidateCache("k7");
    await fetchWithCache("k7", fetcher, { ttlMs: 60000 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
