import { PlatformId, RiotAPI } from '@fightmegg/riot-api'
import { apiKey } from '../../../.env.json'

const rAPI = new RiotAPI(apiKey)

// copied from non-public type definition
export type LoLRegion = PlatformId.BR1 | PlatformId.EUNE1 | PlatformId.EUW1 | PlatformId.JP1 | PlatformId.KR | PlatformId.LA1 | PlatformId.LA2 | PlatformId.NA1 | PlatformId.OC1 | PlatformId.RU | PlatformId.TR1 | PlatformId.PH2 | PlatformId.SG2 | PlatformId.TH2 | PlatformId.TW2 | PlatformId.VN2;
export type LolRank = { tier: string, rank: string, lp: number }
export async function getSoloDuoRank(region: LoLRegion, summonerId: string): Promise<LolRank> {
    try {
        const summoners = (await rAPI.league.getEntriesBySummonerId({
            region,
            summonerId
        })).filter((v) => v.queueType == 'RANKED_SOLO_5x5')
        if (summoners.length != 1) throw Error()
        const summoner = summoners[0]
        return { tier: `${summoner.tier[0]}${summoner.tier.slice(1).toLowerCase()}`, rank: summoner.rank, lp: summoner.leaguePoints }
    } catch(e) {
        console.log(`Couldn't fetch summoner ${summonerId}`)
        return { tier: `error`, rank: 'error', lp: -1 }
    }
}

export async function getSummonerID(region: LoLRegion, summonerName: string): Promise<string | undefined> {
    return (await rAPI.summoner.getBySummonerName({
        region,
        summonerName
    }).catch((e) => ({ id: undefined }))).id
}

export async function getSummonerNickname(region: LoLRegion, summonerId: string): Promise<string | undefined> {
    try {
        const summoners = await rAPI.league.getEntriesBySummonerId({
            region,
            summonerId
        });
        if (summoners.length != 1) return
        return summoners[0].summonerName
    } catch(e) {
        console.log(`Couldn't fetch summoner ${summonerId}`)
    }
}

export function regionFromStr(region: string) {
    return {
        'euw': PlatformId.EUW1,
        'eune': PlatformId.EUNE1,
        'na': PlatformId.NA1,
    }[region] as LoLRegion | undefined
}