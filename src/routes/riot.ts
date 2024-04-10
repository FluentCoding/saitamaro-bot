import { FastifyInstance } from "fastify";
import { getChampions } from "../features/riot/champs";
import { allGuides } from "../features/store/guides";
import { secureRoutes } from "../middleware/auth";

export default function registerRiotRoutes(app: FastifyInstance) {
  secureRoutes(app, "/riot/");
  app.get("/riot/open-champs", async () => {
    const champs = Object.keys(await allGuides());
    const riotChamps = await getChampions();
    return riotChamps.filter((c) => !champs.includes(c)).sort();
  });
}
