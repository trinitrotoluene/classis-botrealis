import { logger } from "@src/logger";
import type { CommandBase } from "./command";
import {
  ErrorResult,
  GenericError,
  SuccessResult,
  type TResult,
} from "./results";

export class CommandBusImpl {
  async execute<
    TCommandResult,
    TCommand extends CommandBase<object, TCommandResult>,
  >(
    command: TCommand,
  ): Promise<TResult<Awaited<ReturnType<TCommand["execute"]>>>> {
    try {
      logger.info(`Executing ${command}`);

      const result = await command.execute();
      logger.info("OK");

      return new SuccessResult(
        result as Awaited<ReturnType<TCommand["execute"]>>,
      );
      // eslint-disable-next-line
    } catch (error: any) {
      logger.error(error, "Error executing command");

      if (error instanceof ErrorResult) {
        // @ts-expect-error - There may be error types that are not in TResult but we should still return them instead of a generic error.
        return error;
      }

      return new GenericError(
        process.env.ENV === "local"
          ? error.message
          : "An unknown error occurred",
      );
    }
  }
}
