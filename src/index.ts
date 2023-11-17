import { Client, Events, GatewayIntentBits } from 'discord.js'
import { token } from "../.env.json"
import commands from './commands';
import fastify = require('fastify');
import path = require('path');
import registerGuideRoutes from './routes/guide';
import registerRiotRoutes from './routes/riot';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isAutocomplete()) {
        const command = commands[interaction.commandName]
        await command.autocomplete(interaction)
        return;
    }
    if (interaction.isButton()) {
        const metadata = JSON.parse(interaction.customId)
        const command = commands[metadata.command]
        await command.button(interaction, metadata)
        return;
    }
	if (!interaction.isChatInputCommand()) return;

    const command = commands[interaction.commandName]
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`)
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
		}
	}
})
client.login(token)

const app = fastify()
console.log(path.join(__dirname, '../public'))
app.register(require('@fastify/static'), {
    root: path.join(__dirname, '../public'),
    prefix: '/dashboard'
})
registerGuideRoutes(app)
registerRiotRoutes(app)

app.listen({ host: '0.0.0.0', port: 4000 })