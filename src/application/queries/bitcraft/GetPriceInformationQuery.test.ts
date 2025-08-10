import { BuyOrderCache } from "@src/application/services/BuyOrderCache";
import { SellOrderCache } from "@src/application/services/SellOrderCache";
import {
  describe,
  beforeEach,
  vi,
  type MockInstance,
  afterEach,
  it,
  expect,
} from "vitest";
import GetPriceInformationQuery from "./GetPriceInformationQuery";

describe("GetPriceInformationQuery", () => {
  let getBuysSpy: MockInstance;
  let getSellsSpy: MockInstance;

  beforeEach(() => {
    getBuysSpy = vi
      .spyOn(BuyOrderCache, "getOrdersByItemId")
      .mockReturnValue([]);
    getSellsSpy = vi
      .spyOn(SellOrderCache, "getOrdersByItemId")
      .mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Returns undefined if there is no data", async () => {
    const command = new GetPriceInformationQuery({ id: 1 });
    const result = command.execute();

    expect(result).toEqual({
      buy: undefined,
      sell: undefined,
    });
  });

  it("Handles single orders correctly", async () => {
    getBuysSpy.mockReturnValue([
      {
        price: 10,
        quantity: 1,
      },
    ]);
    getSellsSpy.mockReturnValue([
      {
        price: 12,
        quantity: 2,
      },
    ]);

    const command = new GetPriceInformationQuery({ id: 1 });
    const result = command.execute();

    expect(result).toEqual({
      buy: {
        adjustedWeightedAveragePrice: 10,
        highestPrice: 10,
        lowestPrice: 10,
      },
      sell: {
        adjustedWeightedAveragePrice: 12,
        highestPrice: 12,
        lowestPrice: 12,
      },
    });
  });

  it("Handles two orders correctly", async () => {
    getBuysSpy.mockReturnValue([
      {
        price: 10,
        quantity: 1,
      },
      {
        price: 20,
        quantity: 2,
      },
    ]);
    getSellsSpy.mockReturnValue([]);

    const command = new GetPriceInformationQuery({ id: 1 });
    const result = command.execute();

    expect(result).toEqual({
      buy: {
        adjustedWeightedAveragePrice: 16.67,
        highestPrice: 20,
        lowestPrice: 10,
      },
      sell: undefined,
    });
  });

  it("Handles many orders correctly", async () => {
    getBuysSpy.mockReturnValue(
      new Array(100)
        .keys()
        .map((k) => ({
          price: 10 + (k % 10),
          quantity: 2 + (k % 20),
        }))
        .toArray()
    );

    getSellsSpy.mockReturnValue(
      new Array(100)
        .keys()
        .map((k) => ({
          price: 15 + (k % 10),
          quantity: 3 + (k % 20),
        }))
        .toArray()
    );

    const command = new GetPriceInformationQuery({ id: 1 });
    const result = command.execute();

    expect(result).toEqual({
      buy: {
        adjustedWeightedAveragePrice: 15.22,
        highestPrice: 19,
        lowestPrice: 10,
      },
      sell: {
        adjustedWeightedAveragePrice: 20.16,
        highestPrice: 24,
        lowestPrice: 15,
      },
    });
  });

  it("Does not allow prices to be skewed by outliers", () => {
    getBuysSpy.mockReturnValue([
      {
        price: 1,
        quantity: 500,
      },
      {
        price: 15,
        quantity: 200,
      },
      {
        price: 20,
        quantity: 1,
      },
      {
        price: 50,
        quantity: 5,
      },
      {
        price: 10_000,
        quantity: 10,
      },
    ]);

    getSellsSpy.mockReturnValue([]);

    const command = new GetPriceInformationQuery({ id: 1 });
    const result = command.execute();

    expect(result).toEqual({
      buy: {
        adjustedWeightedAveragePrice: 5.34,
        highestPrice: 50,
        lowestPrice: 1,
      },
      sell: undefined,
    });
  });
});
