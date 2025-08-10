import { describe, expect, it } from "vitest";
import { EventHandler } from "./EventHandler";

describe("Event handler", () => {
  it("Can be constructed and subscribed to", () => {
    const handler = new EventHandler<{ type: "foo" }>();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler.subscribe((foo) => {});
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler.subscribe(async (foo) => {});
  });

  it("Invokes subscribers sequentially", async () => {
    const handler = new EventHandler<{ type: "foo" }>();

    const order: number[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler.subscribe((foo) => {
      order.push(1);
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler.subscribe(async (foo) => {
      order.push(2);
    });

    await handler.publish({ type: "foo" });

    expect(order).toEqual([1, 2]);
  });
});
