var {
   EmbedBuilder
} = require('discord.js');
var Roles = require('./roles.js');
var config = require('../config/config.json');

module.exports = {
   helpMenu: async function helpMenu(client, channel, guild, user) {
      let commands = config.discord;
      let prefix = config.discord.prefix;
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
      if (commands.devicesCommand) {
         commandList.push(`Devices: \`${prefix}${commands.devicesCommand}\``);
      }
      if (commands.noProtoCommand) {
         commandList.push(`No Proto: \`${prefix}${commands.noProtoCommand}\``);
      }
      if (commands.linksCommand) {
         commandList.push(`Links: \`${prefix}${commands.linksCommand}\``);
      }
      if (commands.boardCommand) {
         commandList.push(`Boards: \`${prefix}${commands.boardCommand}\``);
      }
      if (commands.questCommand) {
         commandList.push(`Quests: \`${prefix}${commands.questCommand}\``);
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