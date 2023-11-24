import { LolRank } from "../features/riot/leaderboard"

const tiers: Record<string, { value: number, tag: string }> = {
    'Challenger': { value: 9, tag: "<:lolrankchallenger:1176986263878893699>" },
    'Grandmaster': { value: 8, tag: "<:lolrankgrandmaster:1176986266181582921>" },
    'Master': { value: 7, tag: "<:lolrankmaster:1176986267720896512>" },
    'Diamond': { value: 6, tag: "<:lolrankdiamond:1176986258858328165>" },
    'Emerald': { value: 5, tag: "<:lolrankemerald:1176987001053003918>" },
    'Platinum': { value: 4, tag: "<:lolrankplatinum:1176986253225365615>" },
    'Gold': { value: 3, tag: "<:lolrankgold:1176986260741566554>" },
    'Silver': { value: 2, tag: "<:lolranksilver:1176986310599249938>" },
    'Bronze': { value: 1, tag: "<:lolrankbronze:1176986312151146647>" },
    'Iron': { value: 0, tag: "<:lolrankiron:1176986198653292654>" },
}

const divs: Record<string, number> = {
    'I': 3,
    'II': 2,
    'III': 1,
    'IV': 0,
}

export const sortRank = (a: LolRank, b: LolRank) => {
    if (a.tier == b.tier) {
        if (a.rank == b.rank) return b.lp - a.lp
        return divs[b.rank] - divs[a.rank]
    }
    return tiers[b.tier].value - tiers[a.tier].value
}

// 1-indexed
export const withPlacePrefix = (place: number, suffix: string) => {
    return `${{
        1: ':first_place:',
        2: ':second_place:',
        3: ':third_place:'
    }[place] ?? `  ${place}.`} ${suffix}`
}

export const withRankEmoji = (rank: LolRank) => {
    return `${tiers[rank.tier].tag}${rank.tier} ${rank.rank} (${rank.lp} LP)`
}