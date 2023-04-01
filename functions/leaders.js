var {
   ActionRowBuilder,
   SelectMenuBuilder,
   EmbedBuilder,
   ButtonBuilder,
   ButtonStyle
} = require('discord.js');
var fs = require('fs');
var mysql = require('mysql2');
var moment = require('moment-timezone');
var schedule = require('node-schedule');
var Handlebars = require("handlebars");
var config = require('../config/config.json');
var util = require('../util.json');
var translations = require('../config/translations.json');
var locale = {};

module.exports = {
   setLocale() {
      locale = require(`../locale/${config.raidBoardOptions.language || 'en'}.json`);
      console.log('[Leaders] Set Locale to: ' + config.raidBoardOptions.language);
   },
   createNewLeaderboard: async function createNewLeaderboard(interaction, type) {
      var leaderEmbed = new EmbedBuilder().setTitle(`Creating New Leaderboard:`).addFields({
         name: 'Leaderboard Type:',
         value: type
      });
      var leaderOptions = [];
      //Pokemon Options
      leaderOptions.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Pokemon Options').setCustomId(`${config.serverName}~leaderboard~addOption~addPokemon`).addOptions(util.boards.leader.pokemonOptions)));
      //Pokestop Options
      leaderOptions.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Pokestop Options').setCustomId(`${config.serverName}~leaderboard~addOption~addPokestop`).addOptions(util.boards.leader.pokestopOptions)));
      //Gym/Raid Options
      leaderOptions.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Gym/Raid Options').setCustomId(`${config.serverName}~leaderboard~addOption~addGymRaid`).addOptions(util.boards.leader.gymRaidOptions)));
      //Battle Options
      leaderOptions.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Battle Options').setCustomId(`${config.serverName}~leaderboard~addOption~addBattle`).addOptions(util.boards.leader.battleOptions)));
      //Other Options
      var leaderOptionList = util.boards.leader.otherOptions;
      if (type == 'total') {
         leaderOptionList.pop();
         leaderOptionList = leaderOptionList.concat(util.boards.leader.otherTotalOptions);
      }
      leaderOptions.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Other Options').setCustomId(`${config.serverName}~leaderboard~addOption~addOther`).addOptions(leaderOptionList)));
      await interaction.reply({
         content: `- Select options in the order you want them to appear.\n- Select 'Finish Leaderboard' in Other Options menu when done.`,
         embeds: [leaderEmbed],
         components: leaderOptions,
         ephemeral: true
      }).catch(console.error);
   }, //End of createNewLeaderboard()


   addBoardOption: async function addBoardOption(interaction, newOption) {
      let oldEmbed = interaction.message.embeds[0];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields'][0]);
      if (oldEmbed.fields.length == 1) {
         newEmbed.addFields({
            name: `Leaderboard Options:`,
            value: newOption
         });
      } else {
         let newOptionList = oldEmbed.fields[1]['value'].split('\n');
         if (!newOptionList.includes(newOption)) {
            newOptionList.push(newOption);
         }
         newEmbed.addFields({
            name: `Leaderboard Options:`,
            value: newOptionList.join('\n')
         });
      }
      await interaction.update({
         embeds: [newEmbed],
         components: interaction.message.components,
         ephemeral: true
      }).catch(console.error);
   }, //End of addBoardOption()


   addUpdateInterval: async function addUpdateInterval(interaction) {
      if (interaction.message.embeds[0]['fields'].length == 1) {
         return;
      }
      await interaction.update({
         content: ``,
         components: [new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Update Interval').setCustomId(`${config.serverName}~leaderboard~addInterval`).addOptions(util.boards.leader.updateIntervals))],
         ephemeral: true
      }).catch(console.error);
   }, //End of addUpdateInterval()


   verifyLeaderboard: async function verifyLeaderboard(interaction) {
      let oldEmbed = interaction.message.embeds[0];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: `Update Interval:`,
         value: `${interaction.values[0]} Minutes`
      });
      await interaction.update({
         content: ``,
         embeds: [newEmbed],
         components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Start').setCustomId(`${config.serverName}~leaderboard~start`).setStyle(ButtonStyle.Success), new ButtonBuilder().setLabel('Cancel').setCustomId(`${config.serverName}~leaderboard~cancel`).setStyle(ButtonStyle.Danger))],
         ephemeral: true
      }).catch(console.error);
   }, //End of verifyLeaderboard()


   startLeaderboard: async function startLeaderboard(client, interaction) {
      var boardList = JSON.parse(fs.readFileSync('./config/boards.json'));
      let boardType = interaction.message.embeds[0]['fields'][0]['value'];
      //All-Time
      var boardTitle = translations.allTimeLeaderTitle ? translations.allTimeLeaderTitle : 'All-Time Leaders';
      //Daily
      if (boardType == 'daily') {
         boardTitle = translations.dailyLeaderTitle ? translations.dailyLeaderTitle : 'Daily Leaders';
      }
      //Daily
      else if (boardType == 'total') {
         boardTitle = translations.totalLeaderTitle ? translations.totalLeaderTitle : 'Player Total Today';
      }
      let intervalMinutes = interaction.message.embeds[0]['fields'][2]['value'].replace(' Minutes', '');
      var boardData = {};
      boardData.type = boardType;
      boardData.channelID = interaction.message.channel.id;
      boardData.title = boardTitle;
      boardData.options = interaction.message.embeds[0]['fields'][1]['value'].split('\n');
      boardData.updateInterval = `*/${intervalMinutes} * * * *`;
      await interaction.update({
         content: `Board will be created soon, dismiss this anytime or it will automatically delete later.`,
         embeds: [],
         components: [],
         ephemeral: false
      }).catch(console.error);
      await interaction.message.channel.send({
            embeds: [new EmbedBuilder().setTitle(boardTitle).setDescription(`Leaderboard will be created soon...`)]
         }).catch(console.error)
         .then(msg => {
            boardList['leader'][msg.id] = boardData;
            fs.writeFileSync('./config/boards.json', JSON.stringify(boardList));
            //Start cron job
            try {
               const boardJob = schedule.scheduleJob(msg.id, boardData.updateInterval, function () {
                  module.exports.runLeaderboardCron(client, msg.id);
               });
            } catch (err) {
               console.log(err);
            }
            //Run first time
            module.exports.runLeaderboardCron(client, msg.id);
         });
   }, //End of startLeaderboard()


   cancelLeaderboard: async function cancelLeaderboard(interaction) {
      await interaction.update({
         content: `Leaderboard cancelled, dismiss this anytime or it will automatically delete later.`,
         embeds: [],
         components: [],
         ephemeral: true
      }).catch(console.error);
   }, //End of cancelLeaderboard()


   runLeaderboardCron: async function runLeaderboardCron(client, messageID) {
      runQuery = (query) => {
         let connection = mysql.createConnection(config.golbatDB);
         return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
               if (error) {
                  connection.end();
                  return reject(error);
               }
               connection.end();
               return resolve(results);
            });
         });
      };
      let boardList = JSON.parse(fs.readFileSync('./config/boards.json'));
      var boardData;
      if (!boardList['leader'][messageID]) {
         console.log(`Leaderboard message ${messageID} not found in boards.json config.`);
         return;
      } else {
         boardData = boardList['leader'][messageID];
      }
      let boardChannel = await client.channels.cache.get(boardData.channelID);
      var boardMessage;
      try {
         boardMessage = await boardChannel.messages.fetch(messageID);
      } catch (err) {
         console.log(`Leaderboard message ${messageID} not found.`);
         return;
      }
      let footerFormatDate = config.raidBoardOptions.useDayMonthYear == true ? 'DD/MM/YY' : 'MM/DD/YY';
      let footerFormatTime = config.raidBoardOptions.use24Hour == true ? 'H:mm:ss' : 'h:mm:ss A';
      let footerFormat = `${footerFormatDate}, ${footerFormatTime}`;
      let footerText = `${moment().add(config.timezoneOffsetHours, 'hours').format(footerFormat)}`;
      var leaderArray = [];

      for (var i in boardData.options) {
         //All-Time
         if (boardData.type == 'all_time') {
            let query = util.queries.leaderboard.allTimeLeaders.replaceAll('{{option}}', boardData.options[i]).replace('{{exludedUsers}}', `'${config.leaderboard.excludedUsers.join("','")}'`).replace('{{limit}}', config.leaderboard.allTimeUserLimit);
            leaderArray.push({
               option: translations[boardData.options[i]] ? translations[boardData.options[i]] : boardData.options[i],
               results: await runQuery(query)
            });
         }
         //Daily
         else if (boardData.type == 'daily') {
            let query = util.queries.leaderboard.dailyLeaders.replaceAll('{{option}}', boardData.options[i]).replace('{{golbatDB}}', config.golbatDB.database).replace('{{leaderboardDB}}', config.leaderboard.database.database).replace('{{exludedUsers}}', `'${config.leaderboard.excludedUsers.join("','")}'`).replace('{{limit}}', config.leaderboard.dailyUserLimit);
            leaderArray.push({
               option: translations[boardData.options[i]] ? translations[boardData.options[i]] : boardData.options[i],
               results: await runQuery(query)
            });
         }
         //Total
         else if (boardData.type == 'total') {
            var query;
            //Special player count queries
            if (boardData.options[i] == 'playersIncluded' || boardData.options[i] == 'newPlayersToday') {
               query = util.queries.leaderboard[boardData.options[i]].replaceAll('{{option}}', boardData.options[i]).replace('{{golbatDB}}', config.golbatDB.database).replace('{{leaderboardDB}}', config.leaderboard.database.database);
            }
            //Normal queries
            else {
               query = util.queries.leaderboard.totalDaily.replaceAll('{{option}}', boardData.options[i]).replace('{{golbatDB}}', config.golbatDB.database).replace('{{leaderboardDB}}', config.leaderboard.database.database);
            }
            leaderArray.push({
               option: translations[boardData.options[i]] ? translations[boardData.options[i]] : boardData.options[i],
               results: await runQuery(query)
            });
         }

      } //End of i loop
      var leaderEmbed = new EmbedBuilder().setTitle(boardData.title).setFooter({
         text: footerText
      });
      for (var a in leaderArray) {
         //Leader ranks
         if (boardData.type == 'all_time' || boardData.type == 'daily') {
            var leaderList = [];
            for (r = 0; r < leaderArray[a]['results'].length; r++) {
               leaderList.push(`${r + 1}: **${leaderArray[a]['results'][r]['name']}** (${Number(leaderArray[a]['results'][r]['value']).toLocaleString()})`);
            } //End of a loop
            leaderEmbed.addFields({
               name: leaderArray[a]['option'],
               value: leaderList.join('\n').replace('1:', '🥇').replace('2:', '🥈').replace('3:', '🥉'),
               inline: false
            });
         }
         //Totals
         else if (boardData.type == 'total') {
            leaderEmbed.addFields({
               name: leaderArray[a]['option'],
               value: Number(leaderArray[a]['results'][0]['value']).toLocaleString(),
               inline: false
            });
         }
      } //End of a loop
      boardMessage.edit({
         content: ``,
         embeds: [leaderEmbed]
      }).catch(console.error);

   } //End of runLeaderboardCron()
}