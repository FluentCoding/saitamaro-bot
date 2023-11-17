import { Config, JsonDB } from "node-json-db"

const db = new JsonDB(new Config("guides", true, false))

const championPath = (champion: string) => `/guides/${champion}`

export function allGuides() {
    return db.getObjectDefault("/guides", {})
}

export async function getGuide(champion: string) {
    return db.getObjectDefault(championPath(champion), undefined)
}

export async function newGuide(champion: string) {
    await setGuide(champion, {
        image: {
            "runes": ["SHIELD BASH", "BONE PLATING"],
            "starter": "dblade",
            "difficulty": 3
        },
        contents: {
            "General": ""
        }
    })
}

export async function setGuide(champion: string, guide: any) {
    await db.push(championPath(champion), guide)
}

export async function removeGuide(champion: string) {
    await db.delete(championPath(champion))
}