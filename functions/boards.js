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
   ChannelType
} = require('discord.js');
const fs = require('fs');
const mysql = require('mysql2');
const CronJob = require('cron').CronJob;
const Handlebars = require("handlebars");
var Table = require('easy-table');
const config = require('../config/config.json');
const geoConfig = require('../config/geofence.json');
const util = require('../util.json');
const emojis = require('../config/emojis.json');

module.exports = {
   beginCurrentBoard: async function beginCurrentBoard(interaction) {
      var newEmbed = new EmbedBuilder().setTitle(`Creating Current Stat Board:`).addFields({
         name: 'Board Type:',
         value: 'current'
      });
      var geofenceList = [];
      for (var g in geoConfig) {
         geofenceList.push(geoConfig[g]['name']);
      } //End of g loop
      geofenceList.sort();
      geofenceList.unshift('~everywhere~');
      let dropdownsNeeded = Math.min(5, Math.ceil(geofenceList.length / 25));
      var geoCount = 0;
      var componentList = [];
      for (var d = 0; d < dropdownsNeeded; d++) {
         var listOptions = [];
         for (var i = 0; i < 25 && geoCount < geofenceList.length; i++, geoCount++) {
            listOptions.push({
               label: geofenceList[geoCount],
               value: geofenceList[geoCount]
            });
         } //End of i loop
         componentList.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setCustomId(`${config.serverName}~board~current~addArea~${d}`).setPlaceholder('Select geofence name').addOptions(listOptions)));
      } //End of d loop
      interaction.reply({
         embeds: [newEmbed],
         components: componentList,
         ephemeral: true
      }).catch(console.error);
   }, //End of beginCurrentBoard()


   addBoardArea: async function addBoardArea(interaction, boardType, areaName) {
      let oldEmbed = interaction.message.embeds[0];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'Area Name:',
         value: areaName
      });
      var newComponents = [];
      //Current - add Pokemon options
      if (boardType === 'current') {
         newComponents = [new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Pokemon Options').setCustomId(`${config.serverName}~board~${boardType}~addPokemon`).addOptions(util.boards.current.pokemonOptions).setMaxValues(util.boards.current.pokemonOptions.length))]
      }
      interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addBoardArea()


   addBoardPokemon: async function addBoardPokemon(interaction, boardType, pokemonOptions) {
      let oldEmbed = interaction.message.embeds[0];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'Pokemon Options:',
         value: pokemonOptions.join('\n')
      });
      var newComponents = [];
      //Current - add Gym options
      if (boardType === 'current') {
         newComponents = [new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Gym Options').setCustomId(`${config.serverName}~board~${boardType}~addGyms`).addOptions(util.boards.current.gymOptions).setMaxValues(util.boards.current.gymOptions.length))]
      }
      interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addBoardPokemon


   addBoardGyms: async function addBoardGyms(interaction, boardType, gymOptions) {
      let oldEmbed = interaction.message.embeds[0];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'Gym Options:',
         value: gymOptions.join('\n')
      });
      var newComponents = [];
      //Current - add Pokestop options
      if (boardType === 'current') {
         newComponents = [new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Pokestop Options').setCustomId(`${config.serverName}~board~${boardType}~addPokestops`).addOptions(util.boards.current.pokestopOptions).setMaxValues(util.boards.current.pokestopOptions.length))]
      }
      interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addBoardGyms()


   addBoardPokestops: async function addBoardPokestops(interaction, boardType, pokestopOptions) {
      let oldEmbed = interaction.message.embeds[0];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'Pokestop Options:',
         value: pokestopOptions.join('\n')
      });
      var newComponents = [];
      //Current - add update intervals
      if (boardType === 'current') {
         newComponents = [new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Update Interval').setCustomId(`${config.serverName}~board~${boardType}~updateInterval`).addOptions(util.boards.current.updateIntervals))]
      }
      interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addBoardPokestops()


   addBoardUpdateInterval: async function addBoardUpdateInterval(interaction, updateInterval) {
      let oldEmbed = interaction.message.embeds[0];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'Update Interval:',
         value: `every ${updateInterval.replace('*/','').replaceAll(' *','')} minutes`
      });
      //Add verify buttons
      let newComponents = [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Start').setCustomId(`${config.serverName}~board~start`).setStyle(ButtonStyle.Success), new ButtonBuilder().setLabel('Restart').setCustomId(`${config.serverName}~board~current~restart`).setStyle(ButtonStyle.Secondary), new ButtonBuilder().setLabel('Cancel').setCustomId(`${config.serverName}~board~cancel`).setStyle(ButtonStyle.Danger))];
      interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addBoardUpdateInterval()


   startNewBoard: async function startNewBoard(client, interaction) {
      var boardList = JSON.parse(fs.readFileSync('./config/boards.json'));
      let boardFields = interaction.message.embeds[0]['fields'];
      let boardType = boardFields[0]['value'];
      //Current
      if (boardType === 'current') {
         var boardData = {};
         boardData.type = 'current';
         boardData.channelID = interaction.message.channel.id;
         boardData.title = `Current Scanner Stats`;
         boardData.area = boardFields[1]['value'];
         boardData.pokemonOptions = boardFields[2]['value'].split('\n');
         boardData.gymOptions = boardFields[3]['value'].split('\n');
         boardData.pokestopOptions = boardFields[4]['value'].split('\n');
         boardData.updateInterval = `*/${boardFields[5]['value'].replace('every ', '').replace(' minutes', '')} * * * *`;
         boardData.geofence = await module.exports.generateGeofence(boardData.area);
         interaction.channel.send({
               embeds: [new EmbedBuilder().setTitle(boardData.title).setDescription(`Board will be created soon...`)]
            }).catch(console.error)
            .then(msg => {
               boardList[msg.id] = boardData
               fs.writeFileSync('./config/boards.json', JSON.stringify(boardList));
               //Start cron job
               let boardJob = new CronJob(boardData.updateInterval, function () {
                  module.exports.runBoardCron(client, msg.id);
               }, null, true, null);
               boardJob.start();
               //Run first time
               module.exports.runBoardCron(client, msg.id);
            });
      } //End of current
      else if (boardType === 'history') {
         var boardData = {};
         boardData.type = 'history';
         boardData.channelID = interaction.message.channel.id;
         boardData.historyLength = boardFields[2]['value'];
         boardData.title = `${boardData.historyLength} Scanner History`;
         boardData.area = '~everywhere~';
         boardData.historyOptions = boardFields[1]['value'].split('\n');
         boardData.updateInterval = '1 0 * * *';
         interaction.channel.send({
               embeds: [new EmbedBuilder().setTitle(boardData.title).setDescription(`Board will be created soon...`)]
            }).catch(console.error)
            .then(msg => {
               boardList[msg.id] = boardData
               fs.writeFileSync('./config/boards.json', JSON.stringify(boardList));
               //Start cron job
               let boardJob = new CronJob(boardData.updateInterval, function () {
                  module.exports.runBoardCron(client, msg.id);
               }, null, true, null);
               boardJob.start();
               module.exports.runBoardCron(client, msg.id);
            });
      } //End of history

      interaction.update({
         content: `Board created, you can dismiss this message now.`,
         embeds: [],
         components: []
      }).catch(console.error);
   }, //End of startNewBoard()


   runBoardCron: async function runBoardCron(client, messageID) {
      let boardList = JSON.parse(fs.readFileSync('./config/boards.json'));
      let boardData = boardList[messageID];
      let boardType = boardData['type'];
      let boardChannel = await client.channels.cache.get(boardData.channelID);
      var boardMessage;
      try {
         boardMessage = await boardChannel.messages.fetch(messageID);
      } catch (err) {
         console.log(`Board message ${messageID} not found.`);
         return;
      }
      runQuery = (query) => {
         let connection = mysql.createConnection(config.rdmDB);
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
      var boardDescription = [];

      //Curent boards
      if (boardType === 'current') {
         //Pokemon options
         if (boardData.pokemonOptions) {
            if (boardData.pokemonOptions[0] !== 'None') {
               for (var i in boardData.pokemonOptions) {
                  var query = util.queries[boardData.pokemonOptions[i]]['query'].replace('{{queryName}}', boardData.pokemonOptions[i]).replace('{{area}}', boardData.geofence);
                  let queryResult = await runQuery(query);
                  let emojiTemplate = Handlebars.compile(util.queries[boardData.pokemonOptions[i]]['label']);
                  let labelText = emojiTemplate(emojis);
                  let resultValue = Number(Object.values(queryResult[0])).toFixed(2).replace(/[.,]00$/, "");
                  boardDescription.push(`${labelText}: **${resultValue ? resultValue : 0}**`);
               } //End of i loop
               boardDescription.push(' ');
            }
         } //End of pokemonOptions
         //Gym Options
         if (boardData.gymOptions) {
            if (boardData.gymOptions[0] !== 'None') {
               for (var i in boardData.gymOptions) {
                  var boardTable = new Table;
                  var query = util.queries[boardData.gymOptions[i]]['query'].replace('{{queryName}}', boardData.gymOptions[i]).replace('{{area}}', boardData.geofence);
                  let queryResult = await runQuery(query);
                  //Single result queries
                  if (boardData.gymOptions[i] === 'current_total_gyms' || boardData.gymOptions[i] === 'current_battling' || boardData.gymOptions[i] === 'current_total_raids' || boardData.gymOptions[i] === 'current_total_eggs') {
                     let emojiTemplate = Handlebars.compile(util.queries[boardData.gymOptions[i]]['label']);
                     let labelText = emojiTemplate(emojis);
                     boardDescription.push(`${labelText}: **${Object.values(queryResult[0]) ? Object.values(queryResult[0]) : 0}**`);
                  }
                  //Multi result queries
                  else if (boardData.gymOptions[i] === 'current_gym_teams') {
                     queryResult.forEach(function (gym) {
                        boardTable.cell('Mystic', gym.Mystic ? gym.Mystic : 0);
                        boardTable.cell('Valor', gym.Valor ? gym.Valor : 0);
                        boardTable.cell('Instinct', gym.Instinct ? gym.Instinct : 0);
                        boardTable.cell('Neutral', gym.Neutral ? gym.Neutral : 0);
                        boardTable.newRow();
                     });
                     boardDescription.push(`${`\``}${boardTable.toString()}${`\``}`);
                  } else if (boardData.gymOptions[i] === 'current_raid_tiers' || boardData.gymOptions[i] === 'current_egg_tiers') {
                     for (var i = 1; i < 9; i++) {
                        if (queryResult[0][`tier_${i}`] != 0) {
                           boardTable.cell(`Tier ${i}`, queryResult[0][`tier_${i}`] ? queryResult[0][`tier_${i}`] : 0);
                        }
                     } //End of i loop
                     boardTable.newRow();
                     if (boardTable.toString() !== '\n\n\n') {
                        boardDescription.push(`${`\``}${boardTable.toString()}${`\``}`);
                     }
                  }
               } //End of i loop
            }
         } //End of gymOptions

         //Pokestop Options
         if (boardData.pokestopOptions) {
            if (boardData.pokestopOptions[0] !== 'None') {
               for (var i in boardData.pokestopOptions) {
                  let emojiTemplate = Handlebars.compile(util.queries[boardData.pokestopOptions[i]]['label']);
                  let labelText = emojiTemplate(emojis);
                  var boardTable = new Table;
                  var query = util.queries[boardData.pokestopOptions[i]]['query'].replace('{{queryName}}', boardData.pokestopOptions[i]).replace('{{area}}', boardData.geofence);
                  let queryResult = await runQuery(query);
                  //Single result queries
                  if (boardData.pokestopOptions[i] === 'current_total_pokestops' || boardData.pokestopOptions[i] === 'current_total_grunts' || boardData.pokestopOptions[i] === 'current_total_leaders') {
                     boardDescription.push(`${labelText}: **${Object.values(queryResult[0]) ? Object.values(queryResult[0]) : 0}**`);
                  }
                  //Multi result queries
                  else if (boardData.pokestopOptions[i] === 'current_total_quests') {
                     boardDescription.push(`${labelText}: **${(queryResult[0][`ar`] + queryResult[0][`non_ar`])}**`);
                  } else if (boardData.pokestopOptions[i] === 'current_total_lures') {
                     boardDescription.push(`${labelText}: **${Object.values(queryResult[0]) ? Object.values(queryResult[0]) : 0}**`);
                  } else if (boardData.pokestopOptions[i] === 'current_lure_types') {
                     if (queryResult[0][`normal`] != 0) {
                        boardTable.cell(`Normal`, queryResult[0][`normal`] ? queryResult[0][`normal`] : 0);
                     }
                     if (queryResult[0][`glacial`] != 0) {
                        boardTable.cell(`Glacial`, queryResult[0][`glacial`] ? queryResult[0][`glacial`] : 0);
                     }
                     if (queryResult[0][`mossy`] != 0) {
                        boardTable.cell(`Mossy`, queryResult[0][`mossy`] ? queryResult[0][`mossy`] : 0);
                     }
                     if (queryResult[0][`magnetic`] != 0) {
                        boardTable.cell(`Magnetic`, queryResult[0][`magnetic`] ? queryResult[0][`magnetic`] : 0);
                     }
                     if (queryResult[0][`rainy`] != 0) {
                        boardTable.cell(`Rainy`, queryResult[0][`rainy`] ? queryResult[0][`rainy`] : 0);
                     }
                     boardTable.newRow();
                     if (boardTable.toString() !== '\n\n\n') {
                        boardDescription.push(`${`\``}${boardTable.toString()}${`\``}`);
                     }
                  } else if (boardData.pokestopOptions[i] === 'current_leader_names') {
                     for (var i = 0; i < queryResult.length; i++) {
                        if (queryResult[i][`count(*)`] != 0) {
                           boardTable.cell(util.protos[queryResult[i][`character`]], queryResult[i][`count(*)`]);
                        }
                     } //End of i loop
                     boardTable.newRow();
                     if (boardTable.toString() !== '\n\n\n') {
                        boardDescription.push(`${`\``}${boardTable.toString()}${`\``}`);
                     }
                  }
               } //End of i loop
            }
         } //End of pokestopOptions
      } //End of current
      //History boards
      else if (boardType === 'history') {
         for (var i in boardData.historyOptions) {
            var query = util.queries[boardData.historyOptions[i]]['query'].replace('{{interval}}', boardData.historyLength);
            let queryResult = await runQuery(query);
            let emojiTemplate = Handlebars.compile(util.queries[boardData.historyOptions[i]]['label']);
            let labelText = emojiTemplate(emojis);
            let resultValue = Number(Object.values(queryResult[0])).toLocaleString();
            boardDescription.push(`${labelText}: **${resultValue}**\n`);
         } //End of i loop
         boardDescription.push(' ');
      } //End of history

      boardMessage.edit({
         content: ``,
         embeds: [new EmbedBuilder().setTitle(boardData.title).setDescription(`${boardDescription.join('\n')}`).setFooter({
            text: boardType == 'current' ? `${boardData.area.replace('~everywhere~','everywhere')} ~ ${new Date().toLocaleString()}` : `${new Date().toLocaleString()}`
         })]
      }).catch(console.error);
   }, //End of runBoardCron()


   startHistoryBoard: async function startHistoryBoard(interaction) {
      var newEmbed = new EmbedBuilder().setTitle(`Creating History Stat Board:`).addFields({
         name: 'Board Type:',
         value: 'history'
      });
      var componentList = [];
      componentList.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setCustomId(`${config.serverName}~board~history~addOptions`).setPlaceholder('Select stat history options').addOptions(util.boards.history.historyOptions).setMaxValues(util.boards.history.historyOptions.length)));
      interaction.reply({
         embeds: [newEmbed],
         components: componentList,
         ephemeral: true
      }).catch(console.error);
   }, //End of startHistoryBoard()


   addHistoryOptions: async function addHistoryOptions(interaction, boardType, historyOptions) {
      let oldEmbed = interaction.message.embeds[0]['data'];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'Stat Options:',
         value: historyOptions.join('\n')
      });
      var componentList = [];
      componentList.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setCustomId(`${config.serverName}~board~${boardType}~addLength`).setPlaceholder('Select stat history length').addOptions(util.boards.history.updateIntervals).setMaxValues(1)));
      interaction.update({
         embeds: [newEmbed],
         components: componentList,
         ephemeral: true
      }).catch(console.error);
   }, //End of addHistoryOptions()


   addHistoryLength: async function addHistoryLength(interaction, boardType, historyLength) {
      let oldEmbed = interaction.message.embeds[0];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'History Length:',
         value: historyLength
      });
      //Add verify buttons
      let newComponents = [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Start').setCustomId(`${config.serverName}~board~start`).setStyle(ButtonStyle.Success), new ButtonBuilder().setLabel('Restart').setCustomId(`${config.serverName}~board~restart`).setStyle(ButtonStyle.Secondary), new ButtonBuilder().setLabel('Cancel').setCustomId(`${config.serverName}~board~cancel`).setStyle(ButtonStyle.Danger))];
      interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addHistoryLength()


   generateGeofence: async function generateGeofence(areaName) {
      var geofence = [];
      if (areaName === '~everywhere~') {
         geofence = `(90.0 -180.0, 90.0 180.0,-90.0 180.0, -90.0 -180.0, 90.0 -180.0)`;
      } else {
         for (var g in geoConfig) {
            if (geoConfig[g]['name'] === areaName) {
               for (var p in geoConfig[g]['path']) {
                  geofence.push(`${geoConfig[g]['path'][p][0]} ${geoConfig[g]['path'][p][1]}`);
               }
               break;
            }
         } //End of g loop
         geofence.push(`${geoConfig[g]['path'][0][0]} ${geoConfig[g]['path'][0][1]}`);
         geofence = `(${geofence.join(', ')})`;
      }
      return geofence;
   }, //End of generateGeofence()
}