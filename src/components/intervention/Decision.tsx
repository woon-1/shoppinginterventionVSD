import React from "react";

type DecisionProps = {
  onDecide: (decision: "wait" | "continue" | "save") => void;
};

export const Decision: React.FC<DecisionProps> = ({ onDecide }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h2 className="text-lg font-semibold">Make Your Decision</h2>
        <p className="text-sm text-gray-600 mt-2">
          What would you like to do next?
        </p>
        <div className="mt-4 space-y-2">
          <button
            className="w-full px-4 py-2 bg-green-500 text-white rounded"
            onClick={() => onDecide("wait")}
          >
            Wait 24 Hours
          </button>
          <button
            className="w-full px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => onDecide("continue")}
          >
            I’ve Thought It Through — Continue
          </button>
          <button
            className="w-full px-4 py-2 bg-gray-500 text-white rounded"
            onClick={() => onDecide("save")}
          >
            Save for Later
          </button>
        </div>
      </div>
    </div>
  );
};