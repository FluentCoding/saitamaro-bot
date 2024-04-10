import fetch from "node-fetch-cache";

export async function fetchCachedJson(url: string): Promise<any> {
  return await (await fetch(url)).json();
}
