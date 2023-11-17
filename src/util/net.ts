export async function fetchCachedJson(url: string): Promise<any> {
    return await (await fetch(url, { cache: "force-cache" })).json()
}