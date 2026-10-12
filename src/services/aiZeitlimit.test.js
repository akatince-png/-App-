import { describe, expect, it, vi } from "vitest";
import { mitZeitlimit } from "./aiProviders";

describe("mitZeitlimit", () => {
  it("bricht eine hängende Anfrage mit verständlicher Meldung ab", async () => {
    vi.useFakeTimers();
    const p = mitZeitlimit(new Promise(() => {}), 1000);
    vi.advanceTimersByTime(1001);
    await expect(p).rejects.toThrow("Aka antwortet gerade nicht");
    vi.useRealTimers();
  });
  it("lässt schnelle Antworten durch", async () => {
    await expect(mitZeitlimit(Promise.resolve("ok"), 1000)).resolves.toBe("ok");
  });
});
