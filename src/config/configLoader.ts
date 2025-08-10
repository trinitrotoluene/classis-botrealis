import { resolve } from "path";
import { ConfigValidator, type ValidatedConfig } from "./configValidator";
import YAML from "yaml";
import fs from "fs";

type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

// Add a Depth parameter to prevent infinite recursion
type Prev = [never, 0, 1, 2, 3, 4, 5];

// Improved version: handles arrays and reduces max depth to 5
type DotNestedKeys<T, Depth extends number = 3> = [Depth] extends [never]
  ? ""
  : T extends object
    ? T extends Array<unknown>
      ? ""
      : {
          [K in Extract<keyof T, string>]: T[K] extends object
            ? T[K] extends Array<unknown>
              ? K
              : `${K}${DotPrefix<DotNestedKeys<T[K], Prev[Depth]>>}`
            : K;
        }[Extract<keyof T, string>]
    : "";

// Example usage to avoid "defined but never used" error
type ConfigKeys = DotNestedKeys<ValidatedConfig>;

type ConfigValueAtPath<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? ConfigValueAtPath<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

function fileBasedConfig() {
  const env = process.env.ENV || "local";

  const __dirname = process.cwd();
  const envPath = resolve(__dirname, `./config.${env}.yaml`);

  console.log(`Loading configuration from ${envPath}`);

  const parsedDoc = YAML.parse(fs.readFileSync(envPath, "utf8"));
  let config: ValidatedConfig = ConfigValidator.parse(parsedDoc);
  console.log("Configuration format OK");

  function set<TKey extends ConfigKeys>(
    path: TKey,
    value: ConfigValueAtPath<ValidatedConfig, ConfigKeys>
  ) {
    const keys = path.split(".");
    if (keys.length < 1) {
      throw new Error(`Tried to set invalid config path ${path}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentConfigSection: any = config;

    for (let i = 0; i < keys.length - 1; i++) {
      currentConfigSection = currentConfigSection[keys[i]];
    }

    currentConfigSection[keys[keys.length - 1]] = value;

    config = ConfigValidator.parse(config);
    fs.writeFileSync(envPath, YAML.stringify(config), "utf8");
  }

  return {
    ...config,
    set: set,
  };
}

// Hack to allow us to run parts of the app in CI
function environmentBasedConfig(): Partial<ValidatedConfig> {
  return {
    discord: {
      token: process.env.DISCORD_BOT_TOKEN,
      dev_app_id: process.env.DISCORD_APP_ID,
    },
    bitcraft: {
      uri: process.env.BITCRAFT_URI,
      module: process.env.BITCRAFT_MODULE,
    },
    postgres: {},
  } as ValidatedConfig;
}

export const Config: ReturnType<typeof fileBasedConfig> = process.env.CI
  ? (environmentBasedConfig() as ReturnType<typeof fileBasedConfig>)
  : fileBasedConfig();
