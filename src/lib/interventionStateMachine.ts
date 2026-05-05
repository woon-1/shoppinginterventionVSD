export type InterventionState =
  | "trigger"
  | "pause"
  | "context"
  | "reflection"
  | "decision"
  | "post-decision";

type Transition = {
  from: InterventionState;
  to: InterventionState;
  action: string;
};

export class InterventionStateMachine {
  private state: InterventionState;
  private transitions: Transition[];

  constructor(initialState: InterventionState) {
    this.state = initialState;
    this.transitions = [
      { from: "trigger", to: "pause", action: "enter" },
      { from: "pause", to: "context", action: "next" },
      { from: "context", to: "reflection", action: "next" },
      { from: "reflection", to: "decision", action: "next" },
      { from: "decision", to: "post-decision", action: "next" },
    ];
  }

  getState(): InterventionState {
    return this.state;
  }

  transition(action: string): boolean {
    const validTransition = this.transitions.find(
      (t) => t.from === this.state && t.action === action
    );

    if (validTransition) {
      this.state = validTransition.to;
      return true;
    }

    console.warn(`Invalid transition: ${this.state} -> ${action}`);
    return false;
  }
}