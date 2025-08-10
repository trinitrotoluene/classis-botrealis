import { BuyOrderCache } from "@src/application/services/BuyOrderCache";
import { SellOrderCache } from "@src/application/services/SellOrderCache";
import { CommandBase, type IBitcraftAuctionOrder } from "@src/framework";

export interface Args {
  id: number;
}

export interface Response {
  buy?: {
    adjustedWeightedAveragePrice: number;
    lowestPrice: number;
    highestPrice: number;
  };
  sell?: {
    adjustedWeightedAveragePrice: number;
    lowestPrice: number;
    highestPrice: number;
  };
}

export default class GetPriceInformationQuery extends CommandBase<
  Args,
  Response
> {
  execute() {
    const buyOrders = BuyOrderCache.getOrdersByItemId(this.args.id) ?? [];
    const sellOrders = SellOrderCache.getOrdersByItemId(this.args.id) ?? [];

    return {
      buy: calculatePrices(buyOrders),
      sell: calculatePrices(sellOrders),
    };
  }
}

function calculatePrices(orders: IBitcraftAuctionOrder[]) {
  if (orders.length < 1) {
    return undefined;
  }

  const median = computeMedianPrice(orders);
  const mad = computeMAD(median, orders);
  return processItems(median, mad, orders);
}

function computeMedianPrice<TItem extends { price: number }>(
  items: Array<TItem>
) {
  if (items.length % 2 === 1) {
    return items[Math.floor(items.length / 2)].price;
  }

  const mid = items.length / 2;
  return (items[mid - 1].price + items[mid].price) / 2;
}

function computeMAD<TItem extends { price: number }>(
  medianPrice: number,
  items: Array<TItem>
) {
  const absoluteDeviations: number[] = [];

  for (const item of items) {
    absoluteDeviations.push(Math.abs(item.price - medianPrice));
  }

  absoluteDeviations.sort((a, b) => a - b);

  if (absoluteDeviations.length % 2 === 1) {
    return absoluteDeviations[Math.floor(absoluteDeviations.length / 2)];
  }

  const mid = absoluteDeviations.length / 2;
  return (absoluteDeviations[mid - 1] + absoluteDeviations[mid]) / 2;
}

function processItems<TItem extends { price: number; quantity: number }>(
  median: number,
  mad: number,
  items: Array<TItem>
) {
  const threshold = 2;
  const adjustment = threshold * mad;

  const upperLimit = median + adjustment;
  const lowerLimit = median - adjustment;

  let totalOrderValue: number = 0;
  let totalQuantity: number = 0;
  let highestPrice: number = NaN;
  let lowestPrice: number = NaN;

  for (const item of items) {
    if (item.price >= lowerLimit && item.price <= upperLimit) {
      totalOrderValue += item.price * item.quantity;
      totalQuantity += item.quantity;

      highestPrice = isNaN(highestPrice)
        ? item.price
        : Math.max(item.price, highestPrice);
      lowestPrice = isNaN(lowestPrice)
        ? item.price
        : Math.min(item.price, lowestPrice);
    }
  }

  const adjustedWeightedAveragePrice = totalOrderValue / totalQuantity;

  return {
    adjustedWeightedAveragePrice: Number(
      adjustedWeightedAveragePrice.toFixed(2)
    ),
    lowestPrice,
    highestPrice,
  };
}
