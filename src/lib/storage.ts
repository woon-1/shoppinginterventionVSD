import { AppState, STORAGE_KEY, normalizeAppState } from "./types";
import { clearSetupIntro } from "./setup-intro";

export function loadState(): AppState {
  if (typeof window === "undefined") return normalizeAppState(null);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeAppState(null);
    const parsed = JSON.parse(raw) as AppState;
    return normalizeAppState(parsed);
  } catch {
    return normalizeAppState(null);
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors; not relevant at this scale
  }
}

export function wipeState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    clearSetupIntro();
  } catch {
    // ignore
  }
}
