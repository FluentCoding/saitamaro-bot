import Elysia, { error, t } from "elysia";
import { defaultSeason } from "../../.env.json";
import { randomPreview } from "../features/image/cache";
import { Champion, getChampions } from "../features/riot/champs";
import {
  Guide,
  allGuides,
  getGuide,
  newGuide,
  removeGuide,
  setGuide,
  setGuideVisibility,
} from "../features/store/guides";

type ParamsWithChampion = { params: { champion: Champion } };

export default (app: Elysia) =>
  app
    .get("/all", async () => {
      return Object.entries(await allGuides())
        .map(([k, v]) => ({
          name: k,
          season: v.season ?? defaultSeason,
          public: v.public,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    })
    .get(
      "/new/:champion",
      async ({ params: { champion } }: ParamsWithChampion) => {
        if (
          (await getGuide(champion)) ||
          !(await getChampions()).includes(champion)
        ) {
          return error(500);
        }

        await newGuide(champion);
        console.info(champion, "guide created.");
      }
    )
    .get(
      "/remove/:champion",
      async ({ params: { champion } }: ParamsWithChampion) => {
        await removeGuide(champion);
        console.info(champion, "guide removed.");
      }
    )
    .get(
      "/image/:champion",
      async ({ params: { champion } }: ParamsWithChampion) => {
        const guide = await getGuide(champion);
        if (!guide) return undefined;
        return new Response(await randomPreview(champion, guide), {
          headers: { "Content-Type": "image/png" },
        });
      }
    )
    .post("/save/:champion", async ({ params: { champion }, body }) => {
      await setGuide(champion as Champion, body as Guide);
      console.info(champion, "guide updated.");
      return {};
    })
    .post(
      "/visibility/:champion",
      async ({ params: { champion }, body }) => {
        await setGuideVisibility(champion as Champion, body.public);
        console.info(champion, "visibility toggled.");
      },
      { body: t.Object({ public: t.Boolean() }) }
    )
    .get("/:champion", async ({ params: { champion } }: ParamsWithChampion) => {
      const guide = await getGuide(champion);
      if (guide) {
        return { ...guide, name: champion };
      }
    });
