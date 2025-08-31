import z from "zod";

export const ConfigValidator = z.object({
  discord: z.object({
    token: z.string().min(1, "Discord token is required"),
    dev_guild_id: z.string().optional(),
    dev_app_id: z.string().optional(),
  }),
  postgres: z.object({
    host: z.string().min(1, "Postgres host is required"),
    port: z.number().int().positive().default(5432),
    user: z.string().min(1, "Postgres user is required"),
    password: z.string().min(1, "Postgres password is required"),
    database: z.string().min(1, "Postgres database is required"),
  }),
  bitcraft: z.object({
    email: z.email(),
    accessToken: z.string().optional(),
    authToken: z.string().optional(),
    uri: z.string(),
    module: z.string(),
  }),
  redis: z.object({
    host: z.string(),
    port: z.number(),
  }),
  logger: z
    .object({
      destination: z.string(),
      token: z.string(),
    })
    .optional(),
});

export type ValidatedConfig = z.infer<typeof ConfigValidator>;
