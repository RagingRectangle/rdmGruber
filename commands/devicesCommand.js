const {
	SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const Roles = require('../functions/roles.js');
const Devices = require('../functions/devices.js');
const config = require('../config/config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.discord.devicesCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription("Show status of devices")
		.addStringOption(option =>
			option
			.setName('optional-device')
			.setDescription('UUID of device')),

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		let userPerms = await Roles.getUserCommandPerms(guild, interaction.user);
		if (userPerms.includes('admin') || userPerms.includes('deviceInfo') || userPerms.includes('deviceInfoControl')) {
			interaction.deferReply();
			var deviceID = '';
			var specificCheck = false;
			try {
				if (interaction.options._hoistedOptions[0]['value']) {
					specificCheck = true;
					deviceID = interaction.options._hoistedOptions[0]['value'];
				}
			} catch (err) {}
			if (specificCheck === true) {
				Devices.getDeviceInfo(channel, interaction.user, deviceID);
			} else {
				Devices.deviceStatus(channel, interaction.user);
			}
		} else {
			channel.send(`User *${interaction.user.username}* does not have required device perms`).catch(console.error);
		}
		return "delete";
	},
};