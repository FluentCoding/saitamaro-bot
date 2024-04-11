import { REST, Routes } from "discord.js";
import { clientId, guildId, token } from "../.env.json";
import commands from "./commands";

const rest = new REST().setToken(token);

(async () => {
  try {
    console.info(
      `Started refreshing ${
        Object.values(commands).length
      } application (/) commands.`
    );

    const data = (await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: Object.values(commands).map((c) => c.metadata.toJSON()) }
    )) as { length: number };

    console.info(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
