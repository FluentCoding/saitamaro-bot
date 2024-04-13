import Elysia from "elysia";
import { getChampions } from "../features/riot/champs";
import { allGuides } from "../features/store/guides";

export default new Elysia({ prefix: "/riot" }).get("/open-champs", async () => {
  const champs = Object.keys(await allGuides());
  const riotChamps = await getChampions();
  return riotChamps.filter((c) => !champs.includes(c)).sort();
});
