import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  sessionStorage.clear();
});

describe("startzeit", () => {
  it("misst nach dem Anmelden die Zeit ab dem Anmelde-Tipp und nur einmal pro Seitenaufruf", async () => {
    const { markiereAnmeldung, meldeAppBereit, leseStartzeiten } = await import("./startzeit");
    vi.spyOn(Date, "now").mockReturnValue(1000);
    markiereAnmeldung();
    vi.restoreAllMocks();
    expect(meldeAppBereit(3500)).toMatchObject({ typ: "Anmelden", ms: 2500 });
    expect(meldeAppBereit(9000)).toBeNull();
    expect(leseStartzeiten()).toHaveLength(1);
  });

  it("misst ohne Anmeldung ab Seitenaufruf und behält höchstens 10 Messungen", async () => {
    localStorage.setItem("aka_startzeiten", JSON.stringify(Array.from({ length: 10 }, () => ({ typ: "Öffnen", ms: 1 }))));
    const { meldeAppBereit, leseStartzeiten } = await import("./startzeit");
    expect(meldeAppBereit(5000)).toMatchObject({ typ: "Öffnen" });
    expect(leseStartzeiten()).toHaveLength(10);
  });
});
