/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventHandler } from "@src/bitcraft/EventHandler";

export class PubSubBuilder<
  TEvents extends Record<string, EventHandler<any>> = {},
> {
  private readonly events: TEvents;

  constructor(events: TEvents = {} as TEvents) {
    this.events = events;
  }

  public withEvent<TName extends string, TPayload extends { type: string }>(
    name: TName
  ): PubSubBuilder<
    TEvents & {
      [K in TName]: EventHandler<TPayload>;
    }
  > {
    return new PubSubBuilder({
      ...this.events,
      [name]: new EventHandler<TPayload>(),
    });
  }

  public build(): PubSub<TEvents> {
    return new PubSub(this.events);
  }
}

type EventPayload<T> = T extends EventHandler<infer P> ? P : never;

export class PubSub<TEvents extends Record<string, EventHandler<any>>> {
  constructor(private readonly events: TEvents) {}

  publish<K extends keyof TEvents>(
    event: K,
    payload: EventPayload<TEvents[K]>
  ) {
    this.events[event].publish(payload);
  }

  subscribe<K extends keyof TEvents>(
    event: K,
    callback: (payload: EventPayload<TEvents[K]>) => void
  ) {
    this.events[event].subscribe(callback);
  }
}
