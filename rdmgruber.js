const {
	Client,
	GatewayIntentBits,
	Partials,
	Collection,
	Permissions,
	ActionRowBuilder,
	SelectMenuBuilder,
	MessageButton,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	InteractionType,
	ChannelType,
} = require('discord.js');
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.DirectMessages],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const fs = require('fs');
const Boards = require('./functions/boards.js');
var boardConfig = require('./config/boards.json');
//Update boards.json format
if (!boardConfig.current || !boardConfig.history) {
	async function updateBoards() {
		boardConfig = await Boards.updateBoardFormat(boardConfig);
	}
	updateBoards();
}
//translations.json check
try {
	if (!fs.existsSync('./config/translations.json')) {
		fs.copyFileSync('./config.example/translations.json', './config/translations.json');
	}
} catch (err) {
	console.log(`Error creating copy of translations.json config: ${err}`);
}
//Update masterfile
const request = require('request');
request('https://raw.githubusercontent.com/WatWowMap/Masterfile-Generator/master/master-latest-poracle.json', (error, response, html) => {
	if (!error && response.statusCode == 200) {
		fs.writeFileSync('./masterfile.json', html);
	} else {
		console.log(`Error updating masterfile.json: ${error}`);
	}
});

const pm2 = require('pm2');
const CronJob = require('cron').CronJob;
const config = require('./config/config.json');
const GenerateServerInfo = require('./functions/generateServerInfo.js');
const roleConfig = require('./config/roles.json');
const SlashRegistry = require('./functions/slashRegistry.js');
const Interactions = require('./functions/interactions.js');
const Roles = require('./functions/roles.js');
const Devices = require('./functions/devices.js');
const Pm2Buttons = require('./functions/pm2.js');
const Links = require('./functions/links.js');
const Scripts = require('./functions/scripts.js');
const Queries = require('./functions/queries.js');

var roleMessages = [];
roleConfig.forEach(role => {
	if (role.messageID) {
		roleMessages.push(role.messageID);
	}
});

client.on('ready', async () => {
	console.log("rdmGruber Bot Logged In");
	//Generate server info
	await GenerateServerInfo.generate();
	//Register Slash Commands
	if (config.discord.useSlashCommands === true && config.discord.slashGuildIDs.length > 0) {
		SlashRegistry.registerCommands(client);
	}
	//No Proto Checker
	if (config.rdmDB.host && config.devices.noProtoCheckMinutes > 0) {
		let noProtoJob = new CronJob(`*/${config.devices.noProtoCheckMinutes} * * * *`, function () {
			Devices.noProtoDevices(client, '', '', 'cron');
		}, null, true, null);
		noProtoJob.start();
	}
	//Create current board crons
	for (const [msgID, boardData] of Object.entries(boardConfig.current)) {
		try {
			let boardJob = new CronJob(boardData.updateInterval, function () {
				Boards.runBoardCron(client, msgID, 'current');
			}, null, true, null);
			boardJob.start();
		} catch (err) {
			console.log(err);
		}
	} //End of current boards
	//Create history board crons
	for (const [msgID, boardData] of Object.entries(boardConfig.history)) {
		try {
			let boardJob = new CronJob(boardData.updateInterval, function () {
				Boards.runBoardCron(client, msgID, 'history');
			}, null, true, null);
			boardJob.start();
		} catch (err) {
			console.log(err);
		}
	} //End of history boards
	//Create raid board crons
	for (const [msgID, boardData] of Object.entries(boardConfig.raid)) {
		try {
			let boardJob = new CronJob(boardData.updateInterval, function () {
				Boards.runBoardCron(client, msgID, 'raid');
			}, null, true, null);
			boardJob.start();
		} catch (err) {
			console.log(err);
		}
	} //End of history boards
}); //End of ready()


client.on('messageCreate', async (receivedMessage) => {
	let message = receivedMessage.content.toLowerCase();
	var user = receivedMessage.author;
	//Ignore messages that don't start with prefix
	if (!message.startsWith(config.discord.prefix)) {
		return;
	}
	//Ignore DMs
	if (receivedMessage.channel.type === ChannelType.DM) {
		return;
	}
	//Ignore bot messages
	if (user.bot === true) {
		return;
	}
	//Not in channel list
	if (!config.discord.channelIDs.includes(receivedMessage.channel.id)) {
		return;
	}
	let userPerms = config.discord.adminIDs.includes(receivedMessage.author.id) ? ['admin'] : await Roles.getUserCommandPerms(receivedMessage.guild, user);
	if (userPerms === []) {
		return;
	}
	//PM2
	if (config.discord.pm2Command && message === `${config.discord.prefix}${config.discord.pm2Command}`) {
		if (userPerms.includes('admin') || userPerms.includes('pm2')) {
			Pm2Buttons.updateStatus(receivedMessage.channel, 'new');
		} else {
			receivedMessage.channel.send(`User *${receivedMessage.author.username}* does not have required PM2 perms.`).catch(console.error);
		}
	}
	//Scripts
	else if (config.discord.scriptCommand && message === `${config.discord.prefix}${config.discord.scriptCommand}`) {
		if (userPerms.includes('admin') || userPerms.includes('scripts')) {
			Scripts.sendScriptList(receivedMessage, 'new');
		} else {
			receivedMessage.channel.send(`User *${receivedMessage.author.username}* does not have required script perms.`).catch(console.error);
		}
	}
	//Queries
	else if (config.rdmDB.host && config.discord.queryCommand && message === `${config.discord.prefix}${config.discord.queryCommand}`) {
		if (userPerms.includes('admin') || userPerms.includes('queries')) {
			Queries.queries(receivedMessage.channel);
		} else {
			receivedMessage.channel.send(`User *${receivedMessage.author.username}* does not have required query perms.`).catch(console.error);
		}
	}
	//Links
	else if (config.discord.linksCommand && message === `${config.discord.prefix}${config.discord.linksCommand}`) {
		if (userPerms.includes('admin') || userPerms.includes('links')) {
			Links.links(client, receivedMessage.channel);
		} else {
			receivedMessage.channel.send(`User *${receivedMessage.author.username}* does not have required link perms.`).catch(console.error);
		}
	}
	//Devices
	else if (config.rdmDB.host && config.discord.devicesCommand && message.startsWith(`${config.discord.prefix}${config.discord.devicesCommand}`)) {
		if (userPerms.includes('admin') || userPerms.includes('deviceInfo')) {
			//All devices
			if (message === `${config.discord.prefix}${config.discord.devicesCommand}`) {
				Devices.deviceStatus(receivedMessage.channel, receivedMessage.author);
			}
			//Specific device
			else if (message.startsWith(`${config.discord.prefix}${config.discord.devicesCommand} `)) {
				Devices.getDeviceInfo(receivedMessage.channel, receivedMessage.author, message.replace(`${config.discord.prefix}${config.discord.devicesCommand} `, ''));
			}
		} else {
			receivedMessage.channel.send(`User *${receivedMessage.author.username}* does not have required device perms.`).catch(console.error);
		}
	}
	//No Proto
	else if (config.rdmDB.host && config.discord.noProtoCommand && message === `${config.discord.prefix}${config.discord.noProtoCommand}`) {
		if (userPerms.includes('admin') || userPerms.includes('deviceInfo')) {
			Devices.noProtoDevices(client, receivedMessage.channel, receivedMessage.author, 'search');
		} else {
			receivedMessage.channel.send(`User *${receivedMessage.author.username}* does not have required no proto perms.`).catch(console.error);
		}
	}
}); //End of messageCreate()


//Slash commands
client.on('interactionCreate', async interaction => {
	if (interaction.type !== InteractionType.ApplicationCommand) {
		return;
	}
	let user = interaction.user;
	if (user.bot == true) {
		return;
	}
	const command = client.commands.get(interaction.commandName);
	if (!command) {
		return;
	}
	//Not in channel list
	if (!config.discord.channelIDs.includes(interaction.channelId)) {
		interaction.reply(`Slash commands not allowed in channel *${interaction.channelId}*`);
		return;
	}
	try {
		let slashReturn = await command.execute(client, interaction);
		try {
			if (slashReturn === 'delete') {
				interaction.deleteReply().catch(err);
			}
		} catch (err) {}
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: 'There was an error while executing this command!',
			ephemeral: true
		}).catch(console.error);
	}
}); //End of slash commands


//Buttons and Lists
client.on('interactionCreate', async interaction => {
	if (interaction.type !== InteractionType.MessageComponent) {
		return;
	}
	if (interaction.message.guildId === null) {
		return;
	}
	let user = interaction.member;
	//Verify interaction
	if (!interaction.customId.startsWith(config.serverName)) {
		return;
	}
	var interactionID = interaction.customId.replace(`${config.serverName}~`, '');
	let userPerms = config.discord.adminIDs.includes(user.id) ? ['admin'] : await Roles.getUserCommandPerms(interaction.message.guild, user);
	//Button interaction
	if (interaction.isButton()) {
		Interactions.buttonInteraction(client, interaction, interactionID, userPerms);
	}
	//List interaction
	else if (interaction.isSelectMenu()) {
		Interactions.listInteraction(client, interaction, interactionID, userPerms);
	}
}); //End of buttons/lists


//Reaction added
client.on('messageReactionAdd', async (reaction, user) => {
	if (user.bot == true) {
		return;
	}
	if (reaction.message.partial) await reaction.message.fetch();
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Error fetching the message:', error);
			return;
		}
	}
	if (roleMessages.includes(reaction.message.id)) {
		Roles.roles(reaction, user, "add");
	}
}); //End of messageReactionAdd


//Reaction removed
client.on('messageReactionRemove', async (reaction, user) => {
	if (user.bot == true) {
		return;
	}
	if (reaction.message.partial) await reaction.message.fetch();
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Error fetching the message:', error);
			return;
		}
	}
	if (roleMessages.includes(reaction.message.id)) {
		Roles.roles(reaction, user, "remove");
	}
}); //End of messageReactionRemove


client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.login(config.discord.token);