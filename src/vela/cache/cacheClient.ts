import type { TGlobalEntityMap, TRegionalEntityMap } from "../__generated__";
import { getRedis } from "../redis";

export class CacheClientImpl {
  async getByIdGlobal<TEntityName extends keyof TGlobalEntityMap>(
    entityName: TEntityName,
    id: string,
  ): Promise<TGlobalEntityMap[TEntityName] | undefined> {
    const cacheKey = `cache:${entityName}:global`;
    const result = await getRedis().hget(cacheKey, id);
    if (!result) {
      return undefined;
    }

    return JSON.parse(result);
  }

  async getById<TEntityName extends keyof TRegionalEntityMap>(
    entityName: TEntityName,
    module: string | null | undefined,
    id: string,
  ): Promise<TRegionalEntityMap[TEntityName] | undefined> {
    if (!module) {
      throw new Error(
        `Unintentional use of module-scoped cache lookup for ${entityName} ${id} but module was undefined`,
      );
    }
    const cacheKey = `cache:${entityName}:${module}`;
    const result = await getRedis().hget(cacheKey, id);
    if (!result) {
      return undefined;
    }

    return JSON.parse(result);
  }

  async getAll<TEntityName extends keyof TRegionalEntityMap>(
    entityName: TEntityName,
    module: string | null | undefined,
  ): Promise<Map<string, TRegionalEntityMap[TEntityName]>> {
    const cacheKey = `cache:${entityName}:${module}`;
    const result = await getRedis().hgetall(cacheKey);

    const output = new Map();
    for (const key in result) {
      output.set(key, JSON.parse(result[key]));
    }

    return output;
  }

  async getAllGlobal<TEntityName extends keyof TGlobalEntityMap>(
    entityName: TEntityName,
  ): Promise<Map<string, TGlobalEntityMap[TEntityName]>> {
    const cacheKey = `cache:${entityName}:global`;
    const result = await getRedis().hgetall(cacheKey);

    const output = new Map();
    for (const key in result) {
      output.set(key, JSON.parse(result[key]));
    }

    return output;
  }

  async getCaller(entity: { Module?: string; CallerIdentity?: string }) {
    if (!entity.CallerIdentity) {
      return undefined;
    }

    const userState = await this.getById(
      "BitcraftUserState",
      entity.Module,
      entity.CallerIdentity,
    );
    if (!userState) {
      return undefined;
    }

    const usernameState = await this.getByIdGlobal(
      "BitcraftUsernameState",
      userState.UserEntityId,
    );
    if (!usernameState) {
      return { ...userState, username: undefined };
    }

    return {
      ...userState,
      username: usernameState.Username,
    };
  }
}
