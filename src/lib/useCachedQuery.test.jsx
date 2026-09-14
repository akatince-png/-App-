import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useCachedQuery } from "./useCachedQuery";
import { _clearCacheForTests } from "./queryCache";

function Anzeige({ cacheKey, fetcher }) {
  const { data, loading, error } = useCachedQuery(cacheKey, fetcher);
  if (loading) return <div>Lädt…</div>;
  if (error) return <div>Fehler: {error}</div>;
  return <div>Wert: {data}</div>;
}

describe("useCachedQuery", () => {
  beforeEach(() => _clearCacheForTests());

  it("zeigt den geladenen Wert an", async () => {
    const fetcher = vi.fn().mockResolvedValue("42");
    render(<Anzeige cacheKey="q1" fetcher={fetcher} />);
    expect(screen.getByText("Lädt…")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Wert: 42")).toBeInTheDocument());
  });

  it("lädt bei einem erneuten Mount mit demselben Key innerhalb der TTL nicht erneut (Remount-Fall, siehe queryCache.js)", async () => {
    const fetcher = vi.fn().mockResolvedValue("bleibt-gleich");
    const { unmount } = render(<Anzeige cacheKey="q2" fetcher={fetcher} />);
    await waitFor(() => expect(screen.getByText("Wert: bleibt-gleich")).toBeInTheDocument());
    unmount();

    render(<Anzeige cacheKey="q2" fetcher={fetcher} />);
    await waitFor(() => expect(screen.getByText("Wert: bleibt-gleich")).toBeInTheDocument());
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("zeigt eine Fehlermeldung, wenn der fetcher scheitert", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Netzwerk kaputt"));
    render(<Anzeige cacheKey="q3" fetcher={fetcher} />);
    await waitFor(() => expect(screen.getByText("Fehler: Netzwerk kaputt")).toBeInTheDocument());
  });
});
