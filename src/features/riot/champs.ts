import { patch } from '../../../.env.json'
import { fetchCachedJson } from '../../util/net'

const CDN_BASE_URL = 'https://ddragon.leagueoflegends.com/cdn'

export async function getNeutralChampionName(champion: string) {
    const result = await fetchCachedJson(`${CDN_BASE_URL}/${patch}/data/en_US/champion.json`)
    return Object.entries(result.data).find((kv: any) => kv[1].name == champion)[0]
}

export async function getChampions() {
    const result = await fetchCachedJson(`${CDN_BASE_URL}/${patch}/data/en_US/champion.json`)
    return Object.values(result.data).map((c: any) => c.name as string)
}

export async function getChampion(champion: string) {
    return await fetchCachedJson(`${CDN_BASE_URL}/${patch}/data/en_US/champion/${champion}.json`)
}

export function splashArtUrl(champion: string, skin?: number) {
    return `${CDN_BASE_URL}/img/champion/splash/${champion}_${skin ?? 0}.jpg`
}

export async function allSkins(neutralChampion: string): Promise<number[]> {
    return (await getChampion(neutralChampion)).data[neutralChampion].skins.map((skin) => skin.num)
}

export async function randomSplashArtUrl(champion: string) {
    const neutralChampion = await getNeutralChampionName(champion)
    const skins = await allSkins(neutralChampion)
    const randomSkin = skins[Math.floor(Math.random() * skins.length)]
    return splashArtUrl(neutralChampion, randomSkin)
}