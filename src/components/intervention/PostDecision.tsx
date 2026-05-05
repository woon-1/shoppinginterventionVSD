import React from "react";

type PostDecisionProps = {
  decision: "wait" | "continue" | "save";
  onReopen: () => void;
};

export const PostDecision: React.FC<PostDecisionProps> = ({ decision, onReopen }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg border">
      <p className="text-sm text-gray-600">
        {decision === "wait" && "You’ve chosen to wait. We’ll remind you later."}
        {decision === "continue" && "You’ve chosen to continue. Happy shopping!"}
        {decision === "save" && "Item saved for later. You can revisit it anytime."}
      </p>
      <button
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={onReopen}
      >
        Reopen Intervention
      </button>
    </div>
  );
};