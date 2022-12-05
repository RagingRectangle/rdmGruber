var {
	SlashCommandBuilder
} = require('discord.js');
var fs = require('fs');
var config = require('../config/config.json');
var Roles = require('../functions/roles.js');
var Stats = require('../functions/stats.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.discord.workerStatsCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`Get rdmStats for workers`)
		.addStringOption(option =>
			option.setName('worker')
			.setDescription(`Enter worker name`)
			.setRequired(true)
			.setAutocomplete(true))
		.addStringOption(option =>
			option
			.setName('rpl')
			.setDescription('Select report period length')
			.setRequired(true)
			.addChoices({
				name: `15 Min`,
				value: `15min`
			}, {
				name: `Hourly`,
				value: `hourly`
			}, {
				name: `Daily`,
				value: `daily`
			})),


	async execute(client, interaction) {
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		let userPerms = await Roles.getUserCommandPerms(guild, interaction.user);
		if (userPerms.includes('admin') || userPerms.includes('stats')) {
			let statDuration = await interaction.options.getString('rpl');
			let statWorker = await interaction.options.getString('worker');
			Stats.statsWorkerMain(client, interaction, statDuration, statWorker);
		} //End of if userPerms
		else {
			await interaction.reply(`User *${interaction.user.username}* does not have required stats perms`).catch(console.error);
		}
	}, //End of execute()
};