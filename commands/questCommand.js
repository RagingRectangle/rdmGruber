const {
	SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const Roles = require('../functions/roles.js');
const config = require('../config/config.json');
const Quests = require('../functions/quests');
var locale = require('../locale/en.json');
if (config.raidBoardOptions.language) {
	locale = require(`../locale/${config.raidBoardOptions.language}.json`);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.discord.questCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`${locale['Quest'] ? locale['Quest'] : 'Quest'} ${locale['Location'] ? locale['Location'] : 'Location'}`),

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		let userPerms = await Roles.getUserCommandPerms(guild, interaction.user);
		if (userPerms.includes('admin') || userPerms.includes('quests')) {
			let guildUser = await guild.members.cache.find(u => u.id === interaction.user.id);
			Quests.getGeofenceList(client, interaction, userPerms, guildUser['_roles']);
		} //End of if userPerms
		else {
			await channel.send(`User *${interaction.user.username}* does not have required quest perms`).catch(console.error);
		}
		return;
	},
};