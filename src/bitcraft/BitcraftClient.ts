import type {
  DbConnectionBuilder,
  Identity,
} from "@clockworklabs/spacetimedb-sdk";
import {
  DbConnection,
  type ErrorContext,
  type SubscriptionEventContext,
} from "@src/bindings";
import { EventHandler } from "./EventHandler";
import { logger } from "@src/logger";
import type {
  IConnectedEvent,
  IConnectionErrorEvent,
  IDisconnectedEvent,
} from "./events";

/**
 * This class provides a fault tolerant connection to the Bitcraft backend.
 * It will auto-reconnect with exponential backoff if the connection is interrupted.
 */
export class BitcraftClient {
  private readonly builder: DbConnectionBuilder<
    DbConnection,
    ErrorContext,
    SubscriptionEventContext
  >;

  private reconnectAttempts: number;

  public readonly onConnected: EventHandler<IConnectedEvent>;
  public readonly onConnectionError: EventHandler<IConnectionErrorEvent>;
  public readonly onDisconnected: EventHandler<IDisconnectedEvent>;

  constructor(
    private readonly uri: string,
    private readonly moduleName: string,
    private readonly authToken: string
  ) {
    this.builder = DbConnection.builder()
      .withUri(`wss://${uri}`)
      .withModuleName(moduleName)
      .withToken(authToken)
      .onConnect(this.onConnectHandler.bind(this))
      .onDisconnect(this.onDisconnectHandler.bind(this))
      .onConnectError(this.onConnectErrorHandler.bind(this));

    this.onConnected = new EventHandler<IConnectedEvent>();
    this.onConnectionError = new EventHandler<IConnectionErrorEvent>();
    this.onDisconnected = new EventHandler<IDisconnectedEvent>();

    this.reconnectAttempts = 0;
  }

  public connect() {
    this.builder.build();
  }

  private onConnectHandler(conn: DbConnection, identity: Identity) {
    logger.info(
      `Connected to SpacetimeDB with identity: ${identity.toHexString()}`
    );

    this.reconnectAttempts = 0;

    return this.onConnected.publish({ type: "connected", conn, identity });
  }

  private onConnectErrorHandler(ctx: ErrorContext, err: Error) {
    logger.error(`Error connecting to SpacetimeDB: ${err}`, err);

    this.reconnect();

    return this.onConnectionError.publish({
      type: "connectionError",
      err,
    });
  }

  private onDisconnectHandler() {
    logger.warn("Disconnected from SpacetimeDB, attempting to auto-reconnect");

    // we explicitly do not await this as it can delay for quite some time
    this.reconnect();

    return this.onDisconnected.publish({ type: "disconnected" });
  }

  private async reconnect() {
    this.reconnectAttempts++;

    if (this.reconnectAttempts > 10) {
      logger.error("Exhausted reconnect attempts, will not continue retrying");
    }

    const baseDelay = 500; // 500ms
    const delay = baseDelay * Math.pow(2, this.reconnectAttempts);
    logger.info(`Waiting ${delay}ms before reconnecting`);

    await new Promise((resolve) => setTimeout(resolve, delay));

    logger.info("Reconnecting");
    this.connect();
  }
}
