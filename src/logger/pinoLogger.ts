import pino from "pino";

function getRemoteLoggingConfig() {
  return [
    {
      target: "pino-opentelemetry-transport",
      options: {},
    },
  ];
}

function getLocalLoggerConfig() {
  return [
    {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard" },
    },
  ];
}

const isProd = process.env.ENV === "prod";

const transport = isProd
  ? pino.transport({ targets: getRemoteLoggingConfig() })
  : pino.transport({ targets: getLocalLoggerConfig() });

function truncateArrays(
  input: unknown,
  maxLength = 25,
  seen = new WeakSet()
): unknown {
  if (Array.isArray(input)) {
    return input
      .slice(0, maxLength)
      .map((item) => truncateArrays(item, maxLength, seen));
  }

  if (input !== null && typeof input === "object") {
    if (seen.has(input)) {
      return "[Circular]";
    }
    seen.add(input);

    const result: Record<string | symbol, unknown> = {};
    for (const key of Reflect.ownKeys(input)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (input as any)[key];
      result[key] = truncateArrays(value, maxLength, seen);
    }
    return result;
  }

  return input;
}

export const logger = pino(
  {
    level: isProd ? "info" : "debug",
    hooks: {
      logMethod(rawArg, method) {
        const sanitizedArgs = truncateArrays(rawArg);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return method.apply(this, sanitizedArgs as any);
      },
    },
  },
  transport
);
