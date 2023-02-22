var {
   SlashCommandBuilder
} = require('discord.js');
var fs = require('fs');
var config = require('../config/config.json');
var Leaders = require('../functions/leaders.js');
var Roles = require('../functions/roles.js');
var locale = require('../locale/en.json');
if (config.raidBoardOptions.language) {
   locale = require(`../locale/${config.raidBoardOptions.language}.json`);
}

module.exports = {
   data: new SlashCommandBuilder()
      .setName(config.discord.leadersCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
      .setDescription('Create new leaderboard')
      .addSubcommand(subcommand =>
         subcommand
         .setName('daily')
         .setDescription('Create daily leaderboard'))
      .addSubcommand(subcommand =>
         subcommand
         .setName('all_time')
         .setDescription('Create all-time leaderboard')),

   async execute(client, interaction) {
      let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
      let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
      let userPerms = await Roles.getUserCommandPerms(guild, interaction.user);
      if (userPerms.includes('admin')) {
         if (!config.leaderboard.database.host) {
            channel.send(`Leaderboard config not filled out.`).catch(console.error);
         } else if (!config.golbatDB.host) {
            channel.send(`Golbat config not filled out.`).catch(console.error);
         } else if (interaction.options.getSubcommand() === 'daily') {
            Leaders.createNewLeaderboard(interaction, 'daily', 'new');
         } else if (interaction.options.getSubcommand() === 'all_time') {
            Leaders.createNewLeaderboard(interaction, 'all_time', 'new');
         }
      } else {
         channel.send(`User *${interaction.user.username}* does not have required leaderboard perms.`).catch(console.error);
      }
   },
};