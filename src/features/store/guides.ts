import { Config, JsonDB } from "node-json-db"
import { cacheGuide, removeCache } from "../image/cache"
import { Champion } from "../riot/champs"
import { currentSeason } from '../../../.env.json'

export type Rune = 'DEMOLISH' | 'FONT OF LIFE' | 'SHIELD BASH' | 'CONDITIONING' | 'SECOND WIND' | 'BONE PLATING' | 'OVERGROWTH' | 'REVITALIZE' | 'UNFLINCHING'
export type Starter = 'dblade' | 'dshield'
export type Difficulty = 1 | 2 | 3 | 4 | 5

export interface Guide {
    image: {
        runes: [Rune, Rune],
        sums?: string,
        starter: Starter,
        difficulty: Difficulty,
        smallText: string
    },
    contents: Record<string, string>,
    public: boolean,
    season: number
}

const db = new JsonDB(new Config("guides", true, false))

const championPath = (champion: Champion) => `/guides/${champion}`

export function allGuides() {
    return db.getObjectDefault<Record<Champion, Guide>>("/guides", {})
}

export function getGuide(champion: Champion) {
    return db.getObjectDefault<Guide | undefined>(championPath(champion), undefined)
}

export async function getGuideCaseInsensitive(searchQuery: string) {
    const guide = await getGuide(searchQuery as Champion)
    if (!guide) {
        const actual = await Object.keys(await allGuides()).find((c) => c.toLowerCase() == searchQuery.toLowerCase()) as Champion
        if (actual) return { guide: (await getGuide(actual))!, name: actual }
        return undefined
    }
    return { guide, name: searchQuery }
}

export async function newGuide(champion: Champion) {
    await setGuide(champion, {
        image: {
            runes: ["SHIELD BASH", "BONE PLATING"],
            sums: '',
            starter: "dblade",
            difficulty: 3,
            smallText: ''
        },
        contents: {
            "General": ""
        },
        public: false,
        season: currentSeason
    })
}

export async function setGuide(champion: Champion, guide: Guide) {
    // images first -> text second
    const existingGuide = await getGuide(champion)
    // if there hasn't been a guide or the image has changed, cache images
    if (!existingGuide || JSON.stringify(guide.image) != JSON.stringify(existingGuide.image)) {
        await cacheGuide(champion, guide)
    }
    // update season to current
    guide.season = currentSeason
    await db.push(championPath(champion), guide)
}

export async function setGuideVisibility(champion: Champion, visibility: boolean) {
    await db.push(`${championPath(champion)}/public`, visibility)
}

export async function removeGuide(champion: Champion) {
    await db.delete(championPath(champion))
    removeCache(champion)
}