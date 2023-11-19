import { Rune, Starter } from "../store/guides"

export function getRunes() {
    const url = (v: string) => `https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/${v}.png/revision/latest`
    return Object.fromEntries(Object.entries({
        'DEMOLISH': '7/7f/Rune_Demolish',
        'FONT OF LIFE': 'b/b7/Rune_Font_of_Life',
        'SHIELD BASH': '8/81/Rune_Shield_Bash',
        'CONDITIONING': 'e/e6/Rune_Conditioning',
        'SECOND WIND': 'a/ac/Rune_Second_Wind',
        'BONE PLATING': 'd/d2/Rune_Bone_Plating',
        'OVERGROWTH': '1/19/Rune_Overgrowth',
        'REVITALIZE': 'd/da/Rune_Revitalize',
        'UNFLINCHING': 'a/af/Rune_Unflinching'
    }).map(e => [e[0], url(e[1])])) as Record<Rune, string>
}

export function getStarterItemUrl(item: Starter) {
    return `https://ddragon.leagueoflegends.com/cdn/13.22.1/img/item/${{
        'dblade': 1055,
        'dshield': 1054
    }[item]}.png`
}