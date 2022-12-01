var {
	SlashCommandBuilder
} = require('discord.js');
var fs = require('fs');
var config = require('../config/config.json');
var Roles = require('../functions/roles.js');
var Stats = require('../functions/stats.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.discord.statsCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`Get rdmStats results`)
		.addStringOption(option =>
			option
			.setName('type')
			.setDescription('Select type of stat')
			.setRequired(true)
			.addChoices({
				name: `Despawn Time Left`,
				value: `despawnLeft`
			}, {
				name: `Mons Scanned`,
				value: `monsScanned`
			}, {
				name: `Spawnpoints`,
				value: `spawnpoints`
			}, {
				name: `Stat Resets`,
				value: `statResets`
			}))
		.addStringOption(option =>
			option
			.setName('rpl')
			.setDescription('Select report period length')
			.setRequired(true)
			.addChoices({
				name: `Hourly`,
				value: `hourly`
			}, {
				name: `Daily`,
				value: `daily`
			}))
		.addStringOption(option =>
			option.setName('stats_area')
			.setDescription(`Enter area name`)
			.setRequired(true)
			.setAutocomplete(true)),


	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		let userPerms = await Roles.getUserCommandPerms(guild, interaction.user);
		if (userPerms.includes('admin') || userPerms.includes('stats')) {
			let statType = await interaction.options.getString('type');
			let statDuration = await interaction.options.getString('rpl');
			let statArea = await interaction.options.getString('stats_area');
			Stats.statsMain(client, channel, interaction, statType, statDuration, statArea);
		} //End of if userPerms
		else {
			await interaction.reply(`User *${interaction.user.username}* does not have required stats perms`).catch(console.error);
		}
	}, //End of execute()
};