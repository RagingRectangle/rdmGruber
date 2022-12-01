var {
	SlashCommandBuilder
} = require('discord.js');
var Help = require('../functions/help.js');
var config = require('../config/config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.discord.helpCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription("Show help menu and user perms"),

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		interaction.deferReply();
		Help.helpMenu(client, channel, guild, interaction.user);
		return "delete";
	},
};