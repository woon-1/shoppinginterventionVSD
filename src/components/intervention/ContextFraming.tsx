import React, { useState } from "react";
import { formatCurrency } from "@/lib/format";

type ContextFramingProps = {
  cartTotal: number;
  savingsGoal?: {
    label: string;
    amount: number;
  };
  onNext: () => void;
};

export const ContextFraming: React.FC<ContextFramingProps> = ({
  cartTotal,
  savingsGoal,
  onNext,
}) => {
  const [userGoal, setUserGoal] = useState<string>("");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h2 className="text-lg font-semibold">Your Cart</h2>
        <p className="text-sm text-gray-600 mt-2">
          Your cart total is <strong>{formatCurrency(cartTotal)}</strong>.
        </p>
        {savingsGoal && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="text-sm">
              Savings Goal: <strong>{savingsGoal.label}</strong>
            </p>
            <p className="text-sm text-gray-600">
              You are <strong>{((cartTotal / savingsGoal.amount) * 100).toFixed(1)}%</strong> away from your goal.
            </p>
          </div>
        )}
        <div className="mt-4">
          <p className="text-sm text-gray-600">What would you rather spend on?</p>
          <input
            type="text"
            className="mt-2 px-4 py-2 border rounded w-full"
            placeholder="E.g., a vacation, savings, etc."
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
          />
          {userGoal && (
            <p className="text-sm text-gray-600 mt-2">
              Skipping this purchase could bring you closer to: <strong>{userGoal}</strong>.
            </p>
          )}
        </div>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
};