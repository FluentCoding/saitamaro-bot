import { FastifyInstance } from "fastify";
import { defaultSeason } from "../../.env.json";
import { randomPreview } from "../features/image/cache";
import { Champion, getChampions } from "../features/riot/champs";
import {
  allGuides,
  getGuide,
  newGuide,
  removeGuide,
  setGuide,
  setGuideVisibility,
} from "../features/store/guides";
import { secureRoutes } from "../middleware/auth";

export default function registerGuideRoutes(app: FastifyInstance) {
  secureRoutes(app, "/guide/", "/guides");
  app.get("/guides", async () => {
    return Object.entries(await allGuides()).map(([k, v]) => ({
      name: k,
      season: v.season ?? defaultSeason,
      public: v.public,
    }));
  });
  app.get("/guide/:champion", async (req) => {
    const { champion } = req.params as { champion: Champion };
    const guide = await getGuide(champion);
    if (guide) {
      return { ...guide, name: champion };
    }
  });
  app.get("/guide/new/:champion", async (req, reply) => {
    const { champion } = req.params as { champion: Champion };

    if (
      (await getGuide(champion)) ||
      !(await getChampions()).includes(champion)
    ) {
      reply.status(500).send();
      return;
    }

    await newGuide(champion);
    console.log(champion, "guide created.");
  });
  app.get("/guide/remove/:champion", async (req) => {
    const { champion } = req.params as { champion: Champion };
    await removeGuide(champion);
    console.log(champion, "guide removed.");
  });
  app.get("/guide/image/:champion", async (req, reply) => {
    const { champion } = req.params as { champion: Champion };
    const guide = await getGuide(champion);
    if (!guide) return undefined;
    reply.type("image/png");
    reply.send(await randomPreview(champion, guide));
  });
  app.post("/guide/save/:champion", async (req) => {
    const { champion } = req.params as { champion: Champion };
    const { name, ...guide } = JSON.parse(req.body as string);
    console.log(guide);
    await setGuide(champion, guide);
    console.log(champion, "guide updated.");
    return {};
  });
  app.post("/guide/visibility/:champion", async (req) => {
    const { champion } = req.params as { champion: Champion };
    const visibility = JSON.parse(req.body as string)["public"];
    await setGuideVisibility(champion, visibility);
    console.log(champion, "visibility toggled.");
  });
}
