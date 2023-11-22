const ranks: Record<string, { value: number, tag: string }> = {
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

export const sortRank = (a: string, b: string) => {
    const [aTier, aRank] = a.split(" "), [bTier, bRank] = b.split(" ")

    if (aTier == bTier) return divs[bRank] - divs[aRank]
    return ranks[bTier].value - ranks[aTier].value
}

// 1-indexed
export const withPlacePrefix = (place: number, suffix: string) => {
    return `${{
        1: ':first_place:',
        2: ':second_place:',
        3: ':third_place:'
    }[place] ?? `  ${place}.`} ${suffix}`
}

export const withRankEmoji = (rank: string) => {
    const [tier] = rank.split(" ")
    return `${ranks[tier].tag}${rank}`
}