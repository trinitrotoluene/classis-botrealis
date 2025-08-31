import { CommandBusImpl } from "./bus";

export const CommandBus = new CommandBusImpl();
export const QueryBus = new CommandBusImpl();

export { CommandBase } from "./command";

export * from "./events";
export * from "./EventAggregator";
