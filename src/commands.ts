import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import guide from "./commands/guide";
import { ButtonMetadata } from "./util/discord";

export interface Command {
    metadata: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>,
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>,
    button?: <T extends ButtonMetadata>(interaction: ButtonInteraction, metadata: T) => Promise<void>
}

export default {
    guide
} as Record<string, Command>