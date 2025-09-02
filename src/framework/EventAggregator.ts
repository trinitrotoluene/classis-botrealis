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
    eventLimit: number | null = null,
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

    const delay =
      eventLimit !== null && bucket.events.length >= eventLimit
        ? 0
        : delaySeconds * 1000;

    bucket.timer = setTimeout(async () => {
      this.buckets.delete(id);
      try {
        await callback(bucket.events);
      } catch (err: unknown) {
        logger.error(err, "Error thrown during event aggregation callback");
      }
    }, delay);
  }
}
