import { logger } from "@src/logger";

export class EventHandler<TEventArgs extends { type: string }> {
  private readonly subscribers: Array<
    (args: TEventArgs) => Promise<void> | void
  >;

  constructor() {
    this.subscribers = [];
  }

  public subscribe(fn: (args: TEventArgs) => Promise<void> | void) {
    this.subscribers.push(fn);
  }

  public async publish(event: TEventArgs) {
    logger.info(event, `Publishing event ${event.type}`);

    for (const subscriber of this.subscribers) {
      try {
        await subscriber(event);
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(err, `Event handler threw error ${err.message}`);
        } else {
          logger.error(
            err,
            `Event handler threw something (not an error) ${err}`
          );
        }
      }
    }
  }
}
