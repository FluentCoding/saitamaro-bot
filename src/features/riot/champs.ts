import { patch } from '../../../.env.json'
import { fetchCachedJson } from '../../util/net'

const CDN_BASE_URL = 'https://ddragon.leagueoflegends.com/cdn'

// Champion is the human readable name, e.g. Wukong
// NeutralChampion is the internal name used by riot, e.g. MonkeyKing
export type Champion = string & { _: "champion" };
export type NeutralChampion = string & { _: "neutralChampion" };

export async function getNeutralChampionName(champion: Champion): Promise<NeutralChampion> {
    const result = await fetchCachedJson(`${CDN_BASE_URL}/${patch}/data/en_US/champion.json`)
    return Object.entries(result.data).find((kv: any) => kv[1].name == champion)?.[0] as NeutralChampion
}

export async function getChampions() {
    const result = await fetchCachedJson(`${CDN_BASE_URL}/${patch}/data/en_US/champion.json`)
    return Object.values(result.data).map((c: any) => c.name as string)
}

export async function getChampion(champion: NeutralChampion) {
    return await fetchCachedJson(`${CDN_BASE_URL}/${patch}/data/en_US/champion/${champion}.json`)
}

export function splashArtUrl(champion: NeutralChampion, skin?: number) {
    return `${CDN_BASE_URL}/img/champion/splash/${champion}_${skin ?? 0}.jpg`
}

export async function allSkins(neutralChampion: NeutralChampion): Promise<number[]> {
    return (await getChampion(neutralChampion)).data[neutralChampion].skins.map((skin: any) => skin.num)
}

export async function randomSplashArtUrl(champion: Champion) {
    const neutralChampion = await getNeutralChampionName(champion)
    const skins = await allSkins(neutralChampion)
    const randomSkin = skins[Math.floor(Math.random() * skins.length)]
    return splashArtUrl(neutralChampion, randomSkin)
}