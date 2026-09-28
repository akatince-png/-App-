import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

const gesendet = [];
const handler = {};
vi.mock("../lib/supabaseClient", () => ({
  setzeSchreibBeobachter: vi.fn(),
  supabase: {
    channel: (name) => ({
      httpSend: async (ev) => gesendet.push([name, ev]),
      on: (_t, { event }, fn) => {
        handler[`${name}:${event}`] = fn;
        return { subscribe: () => ({ name }) };
      },
    }),
    removeChannel: vi.fn(),
  },
}));

const live = await import("./liveAktualisierung");

describe("Live-Aktualisierung", () => {
  beforeEach(() => {
    gesendet.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    live.setzeLiveZiel(null);
    vi.useRealTimers();
  });

  it("erkennt Schreibzugriffe auf die Datenbank", () => {
    expect(live.istSchreibAnfrage("https://x.supabase.co/rest/v1/routine_schritte", "POST")).toBe(true);
    expect(live.istSchreibAnfrage("https://x.supabase.co/rest/v1/routine_schritte?id=eq.1", "PATCH")).toBe(true);
    expect(live.istSchreibAnfrage("https://x.supabase.co/rest/v1/routine_schritte", "GET")).toBe(false);
    expect(live.istSchreibAnfrage("https://x.supabase.co/functions/v1/send-push", "POST")).toBe(false);
    expect(live.istSchreibAnfrage("https://x.supabase.co/rest/v1/rpc/gruppenprotokoll_status", "POST")).toBe(false);
  });

  it("sendet nur im Verwalten-Modus, mehrere Speichervorgänge = ein Signal", async () => {
    live.aenderungGespeichert();
    await vi.advanceTimersByTimeAsync(1000);
    expect(gesendet).toEqual([]);
    live.setzeLiveZiel("u1");
    live.aenderungGespeichert();
    live.aenderungGespeichert();
    live.aenderungGespeichert();
    await vi.advanceTimersByTimeAsync(1000);
    expect(gesendet).toEqual([["aka-live-u1", "coach-aenderung"]]);
  });

  it("Coachee lädt neu, wartet aber, solange eine Routine läuft", async () => {
    const neu = vi.fn();
    function Coachee({ laeuft }) {
      live.useLiveAktualisierung("u2", true, neu);
      live.useLiveNeuladenSperre(laeuft);
      return null;
    }
    const { rerender } = render(<Coachee laeuft={true} />);
    act(() => handler["aka-live-u2:coach-aenderung"]());
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(neu).not.toHaveBeenCalled();
    rerender(<Coachee laeuft={false} />);
    await act(async () => vi.advanceTimersByTimeAsync(10));
    expect(neu).toHaveBeenCalledTimes(1);
    act(() => {
      handler["aka-live-u2:coach-aenderung"]();
      handler["aka-live-u2:coach-aenderung"]();
    });
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(neu).toHaveBeenCalledTimes(2);
  });
});
