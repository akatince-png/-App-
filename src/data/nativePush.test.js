import { describe, it, expect, vi, beforeEach } from "vitest";

const listener = {};
vi.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    checkPermissions: vi.fn(async () => ({ receive: "prompt" })),
    requestPermissions: vi.fn(async () => ({ receive: "granted" })),
    addListener: vi.fn(async (name, fn) => {
      listener[name] = fn;
      return { remove: vi.fn() };
    }),
    register: vi.fn(async () => {
      setTimeout(() => listener.registration?.({ value: "abc123" }), 0);
    }),
    unregister: vi.fn(async () => {}),
  },
}));

import { PushNotifications } from "@capacitor/push-notifications";
import { gemerkterToken, nativeAbmelden, nativeAnmelden } from "./nativePush";

describe("Push in der iPhone-App", () => {
  beforeEach(() => localStorage.clear());
  it("fragt die Berechtigung, holt den Apple-Token und merkt ihn", async () => {
    await expect(nativeAnmelden()).resolves.toBe("abc123");
    expect(PushNotifications.requestPermissions).toHaveBeenCalled();
    expect(gemerkterToken()).toBe("abc123");
    await nativeAbmelden();
    expect(gemerkterToken()).toBeNull();
  });
  it("bricht verständlich ab, wenn die Berechtigung fehlt", async () => {
    PushNotifications.requestPermissions.mockResolvedValueOnce({ receive: "denied" });
    await expect(nativeAnmelden()).rejects.toThrow("Berechtigung wurde nicht erteilt.");
  });
  it("gibt Apples Fehler weiter", async () => {
    PushNotifications.register.mockImplementationOnce(async () => {
      setTimeout(() => listener.registrationError?.({ error: "keine Push-Berechtigung im Profil" }), 0);
    });
    await expect(nativeAnmelden()).rejects.toThrow("keine Push-Berechtigung im Profil");
  });
});
