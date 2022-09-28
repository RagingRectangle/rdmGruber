const {
	SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const config = require('../config/config.json');
const Boards = require('../functions/boards.js');
const Roles = require('../functions/roles.js');

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
			.setDescription('Create history stat board'))
		.addSubcommand(subcommand =>
			subcommand
			.setName('raid')
			.setDescription('Create raid board')),

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		let userPerms = await Roles.getUserCommandPerms(guild, interaction.user);
		if (userPerms.includes('boards') || userPerms.includes('admin')) {
			if (interaction.options.getSubcommand() === 'current') {
				Boards.beginCurrentBoard(interaction, interaction.message, 'current');
			} else if (interaction.options.getSubcommand() === 'history') {
				Boards.startHistoryBoard(interaction);
			} else if (interaction.options.getSubcommand() === 'raid') {
				Boards.startRaidBoard(interaction);
			}
		}
		else {
			channel.send(`User *${interaction.user.username}* does not have required board perms`).catch(console.error);
		}
	},
};