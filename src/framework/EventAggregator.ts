import { logger } from "@src/logger";

interface IEventBucket<TEvent> {
  events: TEvent[];
  timer?: NodeJS.Timeout;
}
export class EventAggregator<TEvent> {
  private readonly buckets: Map<string, IEventBucket<TEvent>>;
  constructor() {
    this.buckets = new Map();
  }

  push(
    id: string,
    event: TEvent,
    callback: (events: TEvent[]) => void | Promise<void>,
    delaySeconds = 10,
  ) {
    let bucket = this.buckets.get(id);
    if (!bucket) {
      bucket = { events: [] };

      this.buckets.set(id, bucket);
    }

    bucket.events.push(event);

    if (bucket.timer) {
      clearTimeout(bucket.timer);
    }

    bucket.timer = setTimeout(async () => {
      this.buckets.delete(id);
      try {
        await callback(bucket.events);
      } catch (err: unknown) {
        logger.error(err, "Error thrown during event aggregation callback");
      }
    }, delaySeconds * 1000);
  }
}
