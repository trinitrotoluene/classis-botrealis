import { OrderCacheImpl } from "./OrderCacheImpl";
import { describe, it, beforeEach, expect } from "vitest";
import type { IBitcraftAuctionOrder } from "@src/framework";

describe("OrderCache", () => {
  let cache: OrderCacheImpl;

  beforeEach(() => {
    cache = new OrderCacheImpl();
  });

  it("Initialises with an empty list", () => {
    cache.init([]);

    expect(cache.getItemLookupMap().entries().toArray()).toEqual([]);
    expect(cache.getOrderMap().size).toEqual(0);
  });

  it("Initialises with a list of items", () => {
    cache.init([
      { id: "order1", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order2", price: 12, itemId: 2 } as IBitcraftAuctionOrder,
      { id: "order3", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order4", price: 15, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order5", price: 1, itemId: 2 } as IBitcraftAuctionOrder,
      { id: "order6", price: 6, itemId: 2 } as IBitcraftAuctionOrder,
      { id: "order7", price: 20, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order8", price: 5, itemId: 2 } as IBitcraftAuctionOrder,
    ]);

    expect(cache.getItemLookupMap().entries().toArray()).toEqual([
      [
        1,
        [
          { id: "order1", price: 10, itemId: 1 },
          { id: "order3", price: 10, itemId: 1 },
          { id: "order4", price: 15, itemId: 1 },
          { id: "order7", price: 20, itemId: 1 },
        ],
      ],
      [
        2,
        [
          { id: "order5", price: 1, itemId: 2 },
          { id: "order8", price: 5, itemId: 2 },
          { id: "order6", price: 6, itemId: 2 },
          { id: "order2", price: 12, itemId: 2 },
        ],
      ],
    ]);
    expect(cache.getOrderMap().size).toEqual(8);
  });

  it("Inserts an item into an empty cache", () => {
    cache.add({ id: "order1", price: 10, itemId: 1 } as IBitcraftAuctionOrder);

    expect(cache.getItemLookupMap().entries().toArray()).toEqual([
      [1, [{ id: "order1", price: 10, itemId: 1 }]],
    ]);
    expect(cache.getOrderMap().size).toEqual(1);
  });

  it("Inserts an item into an existing cache of size 1 (larger)", () => {
    cache.init([
      { id: "order1", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
    ]);
    cache.add({ id: "order2", price: 12, itemId: 1 } as IBitcraftAuctionOrder);

    expect(cache.getItemLookupMap().get(1)).toEqual([
      { id: "order1", price: 10, itemId: 1 },
      { id: "order2", price: 12, itemId: 1 },
    ]);
    expect(cache.getOrderMap().size).toEqual(2);
  });

  it("Inserts an item into an existing cache of size 1 (smaller)", () => {
    cache.init([
      { id: "order1", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
    ]);
    cache.add({ id: "order2", price: 8, itemId: 1 } as IBitcraftAuctionOrder);

    expect(cache.getItemLookupMap().get(1)).toEqual([
      { id: "order2", price: 8, itemId: 1 },
      { id: "order1", price: 10, itemId: 1 },
    ]);
    expect(cache.getOrderMap().size).toEqual(2);
  });
  it("Inserts an item into an existing cache of size 1 (same)", () => {
    cache.init([
      { id: "order1", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
    ]);
    cache.add({ id: "order2", price: 10, itemId: 1 } as IBitcraftAuctionOrder);

    expect(cache.getItemLookupMap().get(1)).toEqual([
      { id: "order2", price: 10, itemId: 1 },
      { id: "order1", price: 10, itemId: 1 },
    ]);

    expect(cache.getOrderMap().size).toEqual(2);
  });

  it("Inserts an item into a large cache", () => {
    cache.init([
      { id: "order1", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order2", price: 12, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order3", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order4", price: 15, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order5", price: 1, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order6", price: 6, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order7", price: 20, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order8", price: 5, itemId: 1 } as IBitcraftAuctionOrder,
    ]);

    cache.add({ id: "order9", price: 7, itemId: 1 } as IBitcraftAuctionOrder);

    expect(cache.getItemLookupMap().get(1)).toEqual([
      { id: "order5", price: 1, itemId: 1 },
      { id: "order8", price: 5, itemId: 1 },
      { id: "order6", price: 6, itemId: 1 },
      { id: "order9", price: 7, itemId: 1 },
      { id: "order1", price: 10, itemId: 1 },
      { id: "order3", price: 10, itemId: 1 },
      { id: "order2", price: 12, itemId: 1 },
      { id: "order4", price: 15, itemId: 1 },
      { id: "order7", price: 20, itemId: 1 },
    ]);
    expect(cache.getOrderMap().size).toEqual(9);
  });

  it("Removes a nonexistent item", () => {
    cache.remove({ id: "order1", itemId: 1 } as IBitcraftAuctionOrder);

    expect(cache.getItemLookupMap().get(1)).toEqual([]);
    expect(cache.getOrderMap().size).toEqual(0);
  });

  it("Removes a real item from an existing cache of size 1", () => {
    cache.init([
      { id: "order1", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
    ]);
    cache.remove({ id: "order1", itemId: 1 } as IBitcraftAuctionOrder);

    expect(cache.getItemLookupMap().get(1)).toEqual([]);
    expect(cache.getOrderMap().size).toEqual(0);
  });

  it("Removes a real item from an existing large cache", () => {
    cache.init([
      { id: "order1", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order2", price: 12, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order3", price: 10, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order4", price: 15, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order5", price: 1, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order6", price: 6, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order7", price: 20, itemId: 1 } as IBitcraftAuctionOrder,
      { id: "order8", price: 5, itemId: 1 } as IBitcraftAuctionOrder,
    ]);

    cache.remove({ id: "order6", itemId: 1 } as IBitcraftAuctionOrder);

    expect(cache.getItemLookupMap().get(1)).toEqual([
      { id: "order5", price: 1, itemId: 1 },
      { id: "order8", price: 5, itemId: 1 },
      { id: "order1", price: 10, itemId: 1 },
      { id: "order3", price: 10, itemId: 1 },
      { id: "order2", price: 12, itemId: 1 },
      { id: "order4", price: 15, itemId: 1 },
      { id: "order7", price: 20, itemId: 1 },
    ]);
    expect(cache.getOrderMap().size).toEqual(7);
  });
});
