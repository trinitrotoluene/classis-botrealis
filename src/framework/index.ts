import { CommandBusImpl } from "./bus";
import type { CommandBase } from "./command";

export const CommandBus = new CommandBusImpl();
export const QueryBus = new CommandBusImpl();

export { CommandBase } from "./command";

export * from "./events";
export * from "./EventAggregator";

export type CommandResult<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends CommandBase<any, infer R> ? R : never;
export type CommandArgs<T> =
  T extends CommandBase<infer A, unknown> ? A : never;
