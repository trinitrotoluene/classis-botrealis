export interface IOrderMetadata {
  id: string;
  itemId: string;
  price: number;
  quantity: number;
}
/**
 * This type maintains a list of orders sorted by price, lowest first.
 * It also maintains a map to do O(1) lookups by order ID if necessary.
 */
export class OrderCacheImpl {
  private lookupTable: Map<string, IOrderMetadata>;
  private itemLookupTable: Map<string, IOrderMetadata[]>;

  constructor() {
    this.itemLookupTable = new Map();
    this.lookupTable = new Map();
  }

  public getOrder(id: string) {
    return this.lookupTable.get(id);
  }

  public getOrderMap() {
    return this.lookupTable as ReadonlyMap<string, IOrderMetadata>;
  }

  public getItemLookupMap() {
    return this.itemLookupTable as ReadonlyMap<
      string,
      ReadonlyArray<IOrderMetadata>
    >;
  }

  public getOrdersByItemId(itemId: string) {
    return this.itemLookupTable.get(itemId);
  }

  public init(initialOrders: IOrderMetadata[]) {
    // Group orders by itemId
    const groupedOrders = initialOrders.reduce((acc, order) => {
      const list = acc.get(order.itemId) ?? [];
      list.push(order);
      acc.set(order.itemId, list);
      return acc;
    }, new Map<string, IOrderMetadata[]>());

    // Then sort their corresponding lists lowest price first
    for (const [, list] of groupedOrders.entries()) {
      list.sort((a, b) => a.price - b.price);
    }

    this.itemLookupTable = groupedOrders;
    this.lookupTable = new Map(initialOrders.map((x) => [x.id, x]));
  }

  public add(order: IOrderMetadata) {
    this.lookupTable.set(order.id, order);

    const existingEntries = this.itemLookupTable.get(order.itemId) ?? [];
    const index = this.indexOfPrice(order.price, existingEntries);
    existingEntries.splice(index, 0, order);
    this.itemLookupTable.set(order.itemId, existingEntries);
  }

  public remove(order: IOrderMetadata) {
    this.lookupTable.delete(order.id);

    const existingEntries = this.itemLookupTable.get(order.itemId) ?? [];
    const index = existingEntries.findIndex((x) => x.id === order.id);
    if (index !== -1) {
      existingEntries.splice(index, 1);
    }

    this.itemLookupTable.set(order.itemId, existingEntries);
  }

  private indexOfPrice(price: number, orders: IOrderMetadata[]) {
    let low = 0;
    let high = orders.length;

    while (low < high) {
      const midpoint = Math.floor((low + high) / 2);
      if (orders[midpoint].price < price) {
        low = midpoint + 1;
      } else {
        high = midpoint;
      }
    }

    return low;
  }
}
