var {
	SlashCommandBuilder
} = require('discord.js');
var Roles = require('../functions/roles.js');
var Scripts = require('../functions/scripts.js');
var config = require('../config/config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.discord.scriptCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`Get list of scripts`),

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		let userPerms = await Roles.getUserCommandPerms(guild, interaction.user);
		if (userPerms.includes('admin') || userPerms.includes('scripts')) {
			interaction.deferReply();
			Scripts.sendScriptList(interaction, 'new')
		} //End of if userPerms
		else {
			channel.send(`User *${interaction.user.username}* does not have required script perms`).catch(console.error);
		}
		return "delete";
	}, //End of execute()
};