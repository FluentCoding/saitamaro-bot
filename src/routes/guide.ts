import Elysia, { error, t } from "elysia";
import { defaultSeason } from "../../.env.json";
import { randomPreview } from "../features/image/cache";
import { Champion, getChampions } from "../features/riot/champs";
import {
  TGuide,
  allGuides,
  getGuide,
  newGuide,
  removeGuide,
  setGuide,
  setGuideVisibility,
} from "../features/store/guides";

type ParamsWithChampion = { params: { champion: Champion } };

export default new Elysia({ prefix: "/guide" })
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
      champion = decodeURI(champion) as Champion;
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
      champion = decodeURI(champion) as Champion;
      await removeGuide(champion);
      console.info(champion, "guide removed.");
    }
  )
  .get(
    "/image/:champion",
    async ({ params: { champion } }: ParamsWithChampion) => {
      champion = decodeURI(champion) as Champion;
      const guide = await getGuide(champion);
      if (!guide) return undefined;
      return await randomPreview(champion, guide);
    }
  )
  .post(
    "/save/:champion",
    async ({ params: { champion }, body }) => {
      champion = decodeURI(champion) as Champion;
      await setGuide(champion as Champion, body);
      console.info(champion, "guide updated.");
      return {};
    },
    { body: TGuide }
  )
  .post(
    "/visibility/:champion",
    async ({ params: { champion }, body }) => {
      champion = decodeURI(champion) as Champion;
      await setGuideVisibility(champion as Champion, body.public);
      console.info(champion, "visibility toggled.");
    },
    { body: t.Object({ public: t.Boolean() }) }
  )
  .get("/:champion", async ({ params: { champion } }: ParamsWithChampion) => {
    champion = decodeURI(champion) as Champion;
    const guide = await getGuide(champion);
    return guide;
  });
