import { PlatformId, RiotAPI, RiotAPITypes } from "@fightmegg/riot-api";
import { apiKey } from "../../../.env.json";

const rAPI = new RiotAPI(apiKey);
const RANKED_TOKEN = "RANKED_SOLO_5x5";
const nearestRegion = PlatformId.EUROPE;

// copied from non-public type definition
export type LoLRegion =
  | PlatformId.BR1
  | PlatformId.EUNE1
  | PlatformId.EUW1
  | PlatformId.JP1
  | PlatformId.KR
  | PlatformId.LA1
  | PlatformId.LA2
  | PlatformId.NA1
  | PlatformId.OC1
  | PlatformId.RU
  | PlatformId.TR1
  | PlatformId.PH2
  | PlatformId.SG2
  | PlatformId.TH2
  | PlatformId.TW2
  | PlatformId.VN2;
export type LolRank = { tier: string; rank: string; lp: number };
export async function getSoloDuoRank(
  region: LoLRegion,
  summonerId: string
): Promise<LolRank> {
  try {
    const summoner = await getRankedSummonerEntry(region, summonerId);
    if (!summoner) return { tier: `Unranked`, rank: "", lp: 0 };
    return {
      tier: `${summoner.tier[0]}${summoner.tier.slice(1).toLowerCase()}`,
      rank: summoner.rank,
      lp: summoner.leaguePoints,
    };
  } catch (e) {
    console.error(`Couldn't fetch rank of summoner ${summonerId}`);
    return { tier: `error`, rank: "error", lp: -1 };
  }
}

export async function getSummonerID(
  leagueRegion: LoLRegion,
  summonerName: string
): Promise<string | undefined> {
  try {
    const account = await rAPI.account.getByRiotId({
      region: nearestRegion,
      gameName: summonerName.slice(0, summonerName.lastIndexOf("#")),
      tagLine: summonerName.slice(summonerName.lastIndexOf("#") + 1),
    });
    const summoner = await rAPI.summoner.getByPUUID({
      puuid: account.puuid,
      region: leagueRegion,
    });
    return summoner.id;
  } catch (e) {
    console.error(`Couldn't fetch summoner id of ${summonerName}`);
  }
}

export async function getSummonerNickname(
  leagueRegion: LoLRegion,
  summonerId: string
): Promise<string | undefined> {
  try {
    const summoner = await rAPI.summoner.getBySummonerId({
      region: leagueRegion,
      summonerId,
    });
    if (!summoner) return;

    const puuid = summoner.puuid;
    const account = await rAPI.account.getByPUUID({
      region: nearestRegion,
      puuid,
    });
    return `${account.gameName}#${account.tagLine}`;
  } catch (e) {
    console.error(`Couldn't fetch summoner nickname of ${summonerId}`);
  }
}

export function regionFromStr(region: string) {
  return {
    euw: PlatformId.EUW1,
    eune: PlatformId.EUNE1,
    las: PlatformId.LA2,
    na: PlatformId.NA1,
    oce: PlatformId.OC1,
    tr: PlatformId.TR1,
    ru: PlatformId.RU,
    kr: PlatformId.KR,
  }[region] as LoLRegion | undefined;
}

let rankedCache: Record<string, RiotAPITypes.League.LeagueEntryDTO> = {};
async function getRankedSummonerEntry(region: LoLRegion, summonerId: string) {
  if (summonerId in rankedCache) {
    console.debug("Requesting ranked info of", summonerId, "from cache.");
    return rankedCache[summonerId];
  } else {
    console.debug("Requesting ranked info of", summonerId, "from riot's API.");
    const res = (
      await rAPI.league.getEntriesBySummonerId({
        region,
        summonerId,
      })
    ).filter((v) => v.queueType == RANKED_TOKEN)[0];
    rankedCache[summonerId] = res;
    return res;
  }
}

export type ClearRankedSummonersCacheMode = { userId: string } | "all" | "none";
export async function clearRankedSummonersCache(
  clearMode: ClearRankedSummonersCacheMode
) {
  switch (clearMode) {
    case "none":
      return;
    case "all":
      rankedCache = {};
      break;
    default:
      delete rankedCache[clearMode.userId];
      break;
  }
}
