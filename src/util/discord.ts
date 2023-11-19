import { ButtonBuilder, ButtonStyle } from "discord.js";

export interface ButtonMetadata {
    command: string,
    action: string
}

export function createButton<T extends ButtonMetadata>(label: string, metadata: T, style = ButtonStyle.Primary) {
    return new ButtonBuilder().setCustomId(JSON.stringify(metadata)).setLabel(label).setStyle(style)
}