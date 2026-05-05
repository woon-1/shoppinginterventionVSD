import React, { useState } from "react";

type ReflectionProps = {
  prompts: string[];
  onNext: () => void;
};

export const Reflection: React.FC<ReflectionProps> = ({ prompts, onNext }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(50);
  const [reason, setReason] = useState<"need" | "want" | "impulse" | null>(
    null
  );
  const [justification, setJustification] = useState("");
  const requiresText = confidence < 35;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded shadow-lg text-center transition-all duration-300 ease-out opacity-100 translate-y-0 scale-100">
        <h2 className="text-lg font-semibold">Take a Moment to Reflect</h2>
        <p className="text-sm text-gray-600 mt-2">
          Consider the following before proceeding:
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[
            ["need", "I need it"],
            ["want", "I want it"],
            ["impulse", "Impulse"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={reason === value}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                reason === value
                  ? "border-blue-500 bg-blue-100 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
              onClick={() => setReason(value as typeof reason)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {prompts.map((prompt, index) => (
            <button
              key={index}
              className={`w-full px-4 py-2 text-left border rounded ${
                selectedPrompt === prompt ? "bg-blue-100 border-blue-500" : ""
              }`}
              onClick={() => setSelectedPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">How sure are you about this purchase?</p>
          <input
            type="range"
            min="0"
            max="100"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full mt-2"
          />
          <p className="text-sm text-gray-600 mt-2">Confidence: {confidence}%</p>
        </div>
        {requiresText && (
          <div className="mt-4 text-left">
            <p className="text-sm text-gray-600">One sentence: why now?</p>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="mt-2 min-h-[72px] w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="What makes this worth buying today?"
            />
          </div>
        )}
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          onClick={onNext}
          disabled={
            !selectedPrompt || !reason || (requiresText && justification.trim().length === 0)
          }
        >
          Continue
        </button>
      </div>
    </div>
  );
};