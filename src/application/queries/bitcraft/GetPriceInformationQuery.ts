import { BuyOrderCache } from "@src/application/services/BuyOrderCache";
import type { IOrderMetadata } from "@src/application/services/OrderCacheImpl";
import { SellOrderCache } from "@src/application/services/SellOrderCache";
import { CommandBase } from "@src/framework";

export interface Args {
  id: string;
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

function calculatePrices(orders: IOrderMetadata[]) {
  if (orders.length < 1) {
    return undefined;
  }

  const { median, totalQuantity } = computeMedianPrice(orders);
  const mad = computeMAD(median, orders);
  return processItems(median, mad, totalQuantity, orders);
}

function computeMedianPrice<TItem extends { price: number; quantity: number }>(
  items: Array<TItem>,
) {
  let totalQuantity = 0;
  for (const item of items) {
    totalQuantity += item.quantity;
  }

  const isEven = items.length % 2 === 0;
  const lowerMidpoint = Math.floor((totalQuantity - 1) / 2);
  const upperMidpoint = isEven ? lowerMidpoint + 1 : lowerMidpoint;

  let accumulator = 0;
  let lowerMedian: number | undefined;
  let upperMedian: number | undefined;

  for (const item of items) {
    accumulator += item.quantity;

    if (lowerMedian === undefined && accumulator > lowerMidpoint) {
      lowerMedian = item.price;
    }

    if (upperMedian === undefined && accumulator > upperMidpoint) {
      upperMedian = item.price;
      break;
    }
  }

  return {
    totalQuantity,
    median: ((lowerMedian ?? NaN) + (upperMedian ?? NaN)) / 2,
  };
}

function computeMAD<TItem extends { price: number }>(
  medianPrice: number,
  items: Array<TItem>,
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
  totalQuantity: number,
  items: Array<TItem>,
) {
  const threshold = 2;
  const adjustment = threshold * mad;

  const upperLimit = median + adjustment;
  const lowerLimit = median - adjustment;

  let totalOrderValue: number = 0;
  let highestPrice: number = NaN;
  let lowestPrice: number = NaN;

  for (const item of items) {
    if (item.price >= lowerLimit && item.price <= upperLimit) {
      totalOrderValue += item.price * item.quantity;

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
      adjustedWeightedAveragePrice.toFixed(2),
    ),
    lowestPrice,
    highestPrice,
  };
}
