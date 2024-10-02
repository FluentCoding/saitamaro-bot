import { LolRank } from "../features/riot/leaderboard";

const tiers: Record<string, { value: number; tag: string }> =
  Object.fromEntries(
    [
      ["Challenger", "<:lolrankchallenger:1176986263878893699>"],
      ["Grandmaster", "<:lolrankgrandmaster:1176986266181582921>"],
      ["Master", "<:lolrankmaster:1176986267720896512>"],
      ["Diamond", "<:lolrankdiamond:1176986258858328165>"],
      ["Emerald", "<:lolrankemerald:1176987001053003918>"],
      ["Platinum", "<:lolrankplatinum:1176986253225365615>"],
      ["Gold", "<:lolrankgold:1176986260741566554>"],
      ["Silver", "<:lolranksilver:1176986310599249938>"],
      ["Bronze", "<:lolrankbronze:1176986312151146647>"],
      ["Iron", "<:lolrankiron:1176986198653292654>"],
      ["Unranked", "<:lolrankunranked:1213553069388992667>"],
      ["error", ""],
    ].map((v, i, a) => [v[0], { value: a.length - i, tag: v[1] }])
  );

const abbreviatedTier: Record<string, string> = {
  Challenger: "C",
  Grandmaster: "GM",
  Master: "M",
  Diamond: "D",
  Emerald: "E",
  Platinum: "P",
  Gold: "G",
  Silver: "S",
  Bronze: "B",
  Iron: "I",
};

const romanNumeralsToLatin: Record<string, string> = {
  I: "1",
  II: "2",
  III: "3",
  IV: "4",
  "": "",
};

const divs: Record<string, number> = {
  I: 3,
  II: 2,
  III: 1,
  IV: 0,
};

export const sortRank = (a: LolRank, b: LolRank) => {
  if (a.tier == b.tier) {
    if (a.rank == b.rank) return b.lp - a.lp;
    return divs[b.rank] - divs[a.rank];
  }
  return tiers[b.tier].value - tiers[a.tier].value;
};

// 1-indexed
export const withPlacePrefix = (place: number, suffix: string) => {
  return `${
    {
      1: ":first_place:",
      2: ":second_place:",
      3: ":third_place:",
    }[place] ?? `  ${place}.`
  } ${suffix}`;
};

export const withRankEmoji = (rank: LolRank) => {
  if (rank.tier == "Unranked") return `${tiers[rank.tier].tag}Unranked`;
  if (rank.lp == -1) return `Riot communication error (? LP)`;
  return `${tiers[rank.tier].tag}${abbreviatedTier[rank.tier]}${
    romanNumeralsToLatin[rank.rank]
  } ${rank.lp} LP *${rank.wl[0]}W | ${rank.wl[1]}L*`;
};
