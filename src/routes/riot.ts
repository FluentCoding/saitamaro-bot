import { FastifyInstance } from "fastify"
import { allGuides, getGuide, newGuide, removeGuide, setGuide } from "../features/store/guides"
import { checkToken } from "../middleware/auth"
import { getChampions } from "../features/riot/champs"

export default function registerRiotRoutes(app: FastifyInstance) {
    app.addHook('onRequest', checkToken(["/riot/"]))
    app.get('/riot/open-champs', async (req, reply) => {
        const champs = Object.keys((await allGuides()))
        const riotChamps = await getChampions()
        return riotChamps.filter((c) => !champs.includes(c)).sort()
    })
}