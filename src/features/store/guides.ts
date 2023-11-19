import { Config, JsonDB } from "node-json-db"
import { cacheGuide, removeCache } from "../image/cache"

const db = new JsonDB(new Config("guides", true, false))

const championPath = (champion: string) => `/guides/${champion}`

export function allGuides() {
    return db.getObjectDefault("/guides", {})
}

export function getGuide(champion: string) {
    return db.getObjectDefault(championPath(champion), undefined)
}

export async function getGuideCaseInsensitive(champion: string) {
    const guide = await getGuide(champion)
    if (!guide) {
        const actual = await Object.keys(await allGuides()).find((c) => c.toLowerCase() == champion.toLowerCase())
        if (actual) return { guide: await getGuide(actual), name: actual }
        return undefined
    }
    return { guide, name: champion }
}

export async function newGuide(champion: string) {
    await setGuide(champion, {
        image: {
            runes: ["SHIELD BASH", "BONE PLATING"],
            starter: "dblade",
            difficulty: 3,
            smallText: ''
        },
        contents: {
            "General": ""
        },
        public: false
    })
}

export async function setGuide(champion: string, guide: any) {
    // images first -> text second
    const existingGuide = await getGuide(champion)
    // if there hasn't been a guide or the image has changed, cache images
    if (!existingGuide || JSON.stringify(guide.image) != JSON.stringify(existingGuide.image)) {
        await cacheGuide(champion, guide)
    }
    await db.push(championPath(champion), guide)
}

export async function setGuideVisibility(champion: string, visibility: boolean) {
    await db.push(`${championPath(champion)}/public`, visibility)
}

export async function removeGuide(champion: string) {
    await db.delete(championPath(champion))
    removeCache(champion)
}