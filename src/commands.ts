import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import guide from "./commands/guide";
import { ButtonMetadata } from "./util/discord";

export interface Command {
    metadata: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>,
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>,
    button?: (interaction: ButtonInteraction, metadata: ButtonMetadata) => Promise<void>
}

export default {
    guide
} as Record<string, Command>