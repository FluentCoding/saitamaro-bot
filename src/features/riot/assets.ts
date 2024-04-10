import { patch } from "../../../.env.json";
import { Rune, Starter } from "../store/guides";

const fandomWikiImageUrl = (
  source: "lolesports_gamepedia_en" | "leagueoflegends",
  v: string,
) =>
  `https://static.wikia.nocookie.net/${source}/images/${v}.png/revision/latest`;

export function getRunes() {
  return Object.fromEntries(
    Object.entries({
      DEMOLISH: "7/7f/Rune_Demolish",
      "FONT OF LIFE": "b/b7/Rune_Font_of_Life",
      "SHIELD BASH": "8/81/Rune_Shield_Bash",
      CONDITIONING: "e/e6/Rune_Conditioning",
      "SECOND WIND": "a/ac/Rune_Second_Wind",
      "BONE PLATING": "d/d2/Rune_Bone_Plating",
      OVERGROWTH: "1/19/Rune_Overgrowth",
      REVITALIZE: "d/da/Rune_Revitalize",
      UNFLINCHING: "a/af/Rune_Unflinching",
    }).map((e) => [e[0], fandomWikiImageUrl("lolesports_gamepedia_en", e[1])]),
  ) as Record<Rune, string>;
}

export function getPrimaryRuneUrl(primaryRune: string) {
  const v: Record<string, string> = {
    lt: "f/f2/Lethal_Tempo_rune",
    fleet: "4/46/Fleet_Footwork_rune",
    conq: "2/20/Conqueror_rune",
  };
  if (!v[primaryRune]) return;
  return fandomWikiImageUrl("leagueoflegends", v[primaryRune]);
}

export function getSummonerUrl(summoner: string) {
  const sum: Record<string, string> = {
    tp: "Teleport",
    cleanse: "Boost",
    ignite: "Dot",
    ghost: "Haste",
  };
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/Summoner${sum[summoner] ?? uppercaseFirst(summoner)}.png`;
}

export function getStarterItemUrl(item: Starter) {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${
    {
      dblade: 1055,
      dshield: 1054,
    }[item]
  }.png`;
}

const uppercaseFirst = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);
