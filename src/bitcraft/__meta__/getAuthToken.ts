import { Config } from "@src/config";

export async function getAuthToken(email: string, accessCode: string) {
  const response = await fetch(
    `https://api.bitcraftonline.com/authentication/authenticate?email=${email}&accessCode=${accessCode}`,
    {
      method: "POST",
    }
  );

  const resData = await response.json();
  console.log(resData);
  return resData;
}

if (!Config.bitcraft.accessToken) {
  throw new Error("No bitcraft access token in config");
}

const token = (await getAuthToken(
  Config.bitcraft.email,
  Config.bitcraft.accessToken
)) as string;

Config.set("bitcraft.authToken", token);
