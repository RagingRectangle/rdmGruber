const {
	SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const config = require('../config/config.json');
const Boards = require('../functions/boards.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.discord.boardCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription('Create new stat board')
		.addSubcommand(subcommand =>
			subcommand
			.setName('current')
			.setDescription('Create current stat board'))
		.addSubcommand(subcommand =>
			subcommand
			.setName('history')
			.setDescription('Create history stat board')), //End of builder()

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		//Current board
		if (interaction.options.getSubcommand() === 'current') {
			Boards.beginCurrentBoard(interaction, interaction.message, 'current');
		} else if (interaction.options.getSubcommand() === 'history') {
			Boards.startHistoryBoard(interaction);
		}
	},
};