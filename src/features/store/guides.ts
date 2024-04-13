import { Static } from "@sinclair/typebox";
import { t } from "elysia";
import { Config, JsonDB } from "node-json-db";
import { currentSeason } from "../../../.env.json";
import { cacheGuide, removeCache } from "../image/cache";
import { Champion } from "../riot/champs";

const TRune = t.Union([
  t.Literal("DEMOLISH"),
  t.Literal("FONT OF LIFE"),
  t.Literal("SHIELD BASH"),
  t.Literal("CONDITIONING"),
  t.Literal("SECOND WIND"),
  t.Literal("BONE PLATING"),
  t.Literal("OVERGROWTH"),
  t.Literal("REVITALIZE"),
  t.Literal("UNFLINCHING"),
]);
const TStarter = t.Union([t.Literal("dblade"), t.Literal("dshield")]);
const TDifficulty = t.Union([
  t.Literal(1),
  t.Literal(2),
  t.Literal(3),
  t.Literal(4),
  t.Literal(5),
]);
export type Rune = Static<typeof TRune>;
export type Starter = Static<typeof TStarter>;
export type Difficulty = Static<typeof TDifficulty>;

export const TGuide = t.Object({
  image: t.Object({
    runes: t.Tuple([TRune, TRune]),
    sums: t.Optional(t.String()),
    primaryRune: t.Optional(t.String()),
    starter: TStarter,
    difficulty: TDifficulty,
    smallText: t.String(),
  }),
  contents: t.Record(t.String(), t.String()),
  public: t.Boolean(),
  season: t.Number(),
});

export type Guide = Static<typeof TGuide>;
/*export interface Guide {
  image: {
    runes: [Rune, Rune];
    sums?: string;
    primaryRune?: string;
    starter: Starter;
    difficulty: Difficulty;
    smallText: string;
  };
  contents: Record<string, string>;
  public: boolean;
  season: number;
}*/

const db = new JsonDB(new Config("guides", true, false));

const championPath = (champion: Champion) => `/guides/${champion}`;

export function allGuides() {
  return db.getObjectDefault<Record<Champion, Guide>>("/guides", {});
}

export function getGuide(champion: Champion) {
  return db.getObjectDefault<Guide | undefined>(
    championPath(champion),
    undefined
  );
}

export async function getGuideCaseInsensitive(searchQuery: string) {
  const guide = await getGuide(searchQuery as Champion);
  if (!guide) {
    const actual = (await Object.keys(await allGuides()).find(
      (c) => c.toLowerCase() == searchQuery.toLowerCase()
    )) as Champion;
    if (actual) return { guide: (await getGuide(actual))!, name: actual };
    return undefined;
  }
  return { guide, name: searchQuery };
}

export async function newGuide(champion: Champion) {
  await setGuide(champion, {
    image: {
      runes: ["SHIELD BASH", "BONE PLATING"],
      sums: "",
      primaryRune: "",
      starter: "dblade",
      difficulty: 3,
      smallText: "",
    },
    contents: {
      General: "",
    },
    public: false,
    season: currentSeason,
  });
}

export async function setGuide(champion: Champion, guide: Guide) {
  // images first -> text second
  const existingGuide = await getGuide(champion);
  // if there hasn't been a guide or the image has changed, cache images
  if (
    !existingGuide ||
    JSON.stringify(guide.image) != JSON.stringify(existingGuide.image)
  ) {
    await cacheGuide(champion, guide);
  }
  // update season to current
  guide.season = currentSeason;
  await db.push(championPath(champion), guide);
}

export async function setGuideVisibility(
  champion: Champion,
  visibility: boolean
) {
  await db.push(`${championPath(champion)}/public`, visibility);
}

export async function removeGuide(champion: Champion) {
  await db.delete(championPath(champion));
  removeCache(champion);
}
