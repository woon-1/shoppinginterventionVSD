import React, { useEffect, useState } from "react";

type InitialPauseProps = {
  frictionLevel: "light" | "moderate" | "strong";
  onContinue: () => void;
};

export const InitialPause: React.FC<InitialPauseProps> = ({
  frictionLevel,
  onContinue,
}) => {
  const [canContinue, setCanContinue] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const delayMap = {
      light: 0,
      moderate: 1800,
      strong: 4200,
    };
    const delay = delayMap[frictionLevel];
    setMounted(false);
    setCanContinue(false);

    const paintTimer = window.setTimeout(() => setMounted(true), 16);
    const timer = window.setTimeout(() => setCanContinue(true), delay);
    return () => {
      clearTimeout(paintTimer);
      clearTimeout(timer);
    };
  }, [frictionLevel]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div
        className={`bg-white p-6 rounded shadow-lg text-center transition-all duration-300 ease-out ${
          mounted
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-[0.98]"
        }`}
      >
        <h2 className="text-lg font-semibold">Pause for a second</h2>
        <p className="text-sm text-gray-600 mt-2">
          Just a quick check before you continue.
        </p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
};