import { CacheClient } from "@src/vela";

export async function getServerModule(
  id?: string | null,
): Promise<string | undefined> {
  if (!id) {
    return undefined;
  }

  const claim = await CacheClient.getByIdGlobal("BitcraftClaimState", id);

  if (!claim || !claim.Module) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return claim.Module!;
}
