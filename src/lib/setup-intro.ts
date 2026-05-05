const SETUP_INTRO_KEY = "pause.setupIntro.v1";

export function loadSetupIntroComplete(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SETUP_INTRO_KEY) === "1";
}

export function setSetupIntroComplete(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETUP_INTRO_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearSetupIntro(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SETUP_INTRO_KEY);
  } catch {
    // ignore
  }
}
