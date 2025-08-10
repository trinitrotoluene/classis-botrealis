import { Config } from "@src/config";

export async function getAccessCode(email: string) {
  await fetch(
    `https://api.bitcraftonline.com/authentication/request-access-code?email=${email}`,
    {
      method: "POST",
    }
  );
}

await getAccessCode(Config.bitcraft.email);
