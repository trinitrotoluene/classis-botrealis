import type { ErrorContext } from "@src/bindings";

export interface IConnectionErrorEvent {
  type: "connectionError";
  context: ErrorContext;
  err: Error;
}
