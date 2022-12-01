var {
	SlashCommandBuilder
} = require('discord.js');
var fs = require('fs');
var Roles = require('../functions/roles.js');
var config = require('../config/config.json');
var Quests = require('../functions/quests');
var serverInfo = require('../Server_Info.json');
var locale = require('../locale/en.json');

if (config.raidBoardOptions.language) {
	locale = require(`../locale/${config.raidBoardOptions.language}.json`);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.discord.questCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`${locale['Quest'] ? locale['Quest'] : 'Quest'} ${locale['Location'] ? locale['Location'] : 'Location'}`)
		.addStringOption(option =>
			option.setName((locale['Location'] ? locale['Location'] : 'location').toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
			.setDescription((locale['Location'] ? locale['Location'] : 'location').toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
			.setRequired(true)
			.setAutocomplete(true)),

	async execute(client, interaction) {
		await interaction.deferReply();
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		let userPerms = await Roles.getUserCommandPerms(guild, interaction.user);
		if (userPerms.includes('admin') || userPerms.includes('quests')) {
			let selectedArea = interaction.options.getString((locale['Location'] ? locale['Location'] : 'location').toLowerCase().replaceAll(/[^a-z0-9]/gi, '_')).toLowerCase();
			//Verify area name
			for (var g in serverInfo.geofenceList) {
				if (serverInfo.geofenceList[g].toLowerCase() == selectedArea) {
					verifyRoles(serverInfo.geofenceList[g]);
					return;
				}
			} //End of g loop
		} //End of if userPerms
		else {
			await channel.send(`User *${interaction.user.username}* does not have required quest perms`).catch(console.error);
		}

		async function verifyRoles(areaName) {
			if (userPerms.includes('admin') || config.questBoardOptions.roleRestriction != true) {
				Quests.getRewardType(client, interaction, areaName);
				return;
			}
			let guildUser = await guild.members.cache.find(u => u.id === interaction.user.id);
			for (const [roleID, roleFences] of Object.entries(config.questBoardOptions.questRoles)) {
				if (guildUser['_roles'].includes(roleID) && roleFences.includes(areaName)) {
					Quests.getRewardType(client, interaction, areaName);
				}
			}
		} //End of verifyRoles()
		return;
	},
};