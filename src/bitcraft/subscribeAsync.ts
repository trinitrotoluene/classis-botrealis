import type { DbConnection } from "@src/bindings";
import { logger } from "@src/logger";

interface ISubscription {
  unsubscribe: () => void;
}

export function subscribeAsync(
  conn: DbConnection,
  query: string | string[]
): Promise<ISubscription> {
  logger.debug(
    `Starting subscription ${Array.isArray(query) ? query.join("\n") : query}`
  );

  return new Promise((res, err) => {
    const subscription = conn
      .subscriptionBuilder()
      .onApplied(() => {
        logger.debug("Subscription active");
        res({
          unsubscribe: () => {
            if (subscription.isActive()) {
              subscription.unsubscribe();
            }
          },
        });
      })
      .onError((ctx) => {
        logger.debug("Subscription errored");
        err(ctx);
      })
      .subscribe(query);
  });
}
