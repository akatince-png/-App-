import { describe, it, expect, afterEach } from "vitest";
import { viewAusHash, hashFuerView } from "./routing";

describe("viewAusHash", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("liest den View-Namen aus einem gesetzten Hash", () => {
    window.location.hash = "#/tagesplan";
    expect(viewAusHash()).toBe("tagesplan");
  });

  it("gibt null zurück, wenn kein Hash gesetzt ist", () => {
    expect(viewAusHash()).toBeNull();
  });

  it("gibt null zurück bei einem Hash, der nicht dem Muster entspricht", () => {
    window.location.hash = "#irgendwas";
    expect(viewAusHash()).toBeNull();
  });
});

describe("hashFuerView", () => {
  it("baut den passenden Hash für einen View-Namen", () => {
    expect(hashFuerView("tagesplan")).toBe("#/tagesplan");
    expect(hashFuerView("admin-quests")).toBe("#/admin-quests");
  });
});
