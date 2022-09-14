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
   InteractionType,
   ChannelType
} = require('discord.js');
const Roles = require('./roles.js');
const config = require('../config/config.json');

module.exports = {
   helpMenu: async function helpMenu(client, channel, guild, user) {
      let commands = config.discord;
      let prefix = config.discord.prefix;
      var pm2 = scripts = queries = links = devices = systemStats = sendWorker = events = 'N/A';

      var commandList = [];
      if (commands.helpCommand) {
         commandList.push(`Help: \`${prefix}${commands.helpCommand}\``);
      }
      if (commands.pm2Command) {
         commandList.push(`PM2: \`${prefix}${commands.pm2Command}\``);
      }
      if (commands.scriptCommand) {
         commandList.push(`Scripts: \`${prefix}${commands.scriptCommand}\``);
      }
      if (commands.queryCommand) {
         commandList.push(`Queries: \`${prefix}${commands.queryCommand}\``);
      }
      if (commands.linksCommand) {
         commandList.push(`Links: \`${prefix}${commands.linksCommand}\``);
      }
      if (commands.devicesCommand) {
         commandList.push(`Devices: \`${prefix}${commands.devicesCommand}\``);
      }
      if (commands.noProtoCommand) {
         commandList.push(`No Proto: \`${prefix}${commands.noProtoCommand}\``);
      }
      if (commands.systemStatsCommand) {
         commandList.push(`Stats: \`${prefix}${commands.systemStatsCommand}\``);
      }

      let userPerms = await Roles.getUserCommandPerms(guild, user);
      let authorName = user.username;
      var allowedCommands = `**${authorName} Permissions:**\n- ${userPerms.join('\n- ')}`;
      if (userPerms.length == 0) {
         allowedCommands = `**${authorName} Permissions:**\n- None`;
      }

      channel.send({
         embeds: [new EmbedBuilder().setTitle("MadGruber Help Menu").setURL("https://github.com/RagingRectangle/rdmGruber").setDescription(`**Command Syntax:**\n- ${commandList.join('\n- ')}\n\n${allowedCommands}`)]
      }).catch(console.error);
   } //End of helpMenu()
}