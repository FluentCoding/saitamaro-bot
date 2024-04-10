import {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
} from "discord.js";
import guide from "./commands/guide";
import leaderboard from "./commands/leaderboard";
import progress from "./commands/progress";
import { ButtonMetadata } from "./util/discord";

export interface Command {
  metadata: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  button?: <T extends ButtonMetadata>(
    interaction: ButtonInteraction,
    metadata: T
  ) => Promise<void>;
  modalSubmit?: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export default {
  guide,
  leaderboard,
  progress,
} as Record<string, Command>;
