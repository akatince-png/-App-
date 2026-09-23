import { describe, expect, it } from "vitest";
import { istNetzwerkFehler, verstaendlicheFehlermeldung } from "./netzwerkFehler";

describe("istNetzwerkFehler", () => {
  it("erkennt Verbindungsabbrüche aller großen Browser", () => {
    expect(istNetzwerkFehler("TypeError: Load failed")).toBe(true);
    expect(istNetzwerkFehler("TypeError: Failed to fetch")).toBe(true);
    expect(istNetzwerkFehler("NetworkError when attempting to fetch resource.")).toBe(true);
  });
  it("lässt echte Fehlermeldungen durch", () => {
    expect(istNetzwerkFehler("permission denied for function admin_liste_probanden")).toBe(false);
    expect(verstaendlicheFehlermeldung("permission denied")).toBe("permission denied");
    expect(verstaendlicheFehlermeldung("Load failed")).toMatch(/Keine Verbindung/);
  });
});
