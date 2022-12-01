var {
   ActionRowBuilder,
   SelectMenuBuilder,
   EmbedBuilder,
   ButtonBuilder,
   ButtonStyle
} = require('discord.js');
var fs = require('fs');
var {
   find
} = require('geo-tz');
var mysql = require('mysql2');
var moment = require('moment');
var schedule = require('node-schedule');
var Handlebars = require("handlebars");
var Table = require('easy-table');
var config = require('../config/config.json');
var geoConfig = require('../config/geofence.json');
var util = require('../util.json');
var translations = require('../config/translations.json');
var locale = require('../locale/en.json');
if (config.raidBoardOptions.language) {
   locale = require(`../locale/${config.raidBoardOptions.language}.json`);
}

module.exports = {
   beginCurrentBoard: async function beginCurrentBoard(interaction) {
      var newEmbed = new EmbedBuilder().setTitle(`Creating Current Stat Board:`).addFields({
         name: 'Board Type:',
         value: 'current'
      }).addFields({
         name: 'Area Name:',
         value: interaction.options._hoistedOptions[0]['value']
      });
      this.addBoardArea(interaction, 'current', newEmbed)
   }, //End of beginCurrentBoard()


   addBoardArea: async function addBoardArea(interaction, boardType, oldEmbed) {
      var newComponents = [];
      //Current - add Pokemon options
      if (boardType === 'current') {
         newComponents = [new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Pokemon Options').setCustomId(`${config.serverName}~board~${boardType}~addPokemon`).addOptions(util.boards.current.pokemonOptions).setMaxValues(util.boards.current.pokemonOptions.length))]
      }
      await interaction.reply({
         embeds: [oldEmbed],
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
      await interaction.update({
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
      await interaction.update({
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
         newComponents = [new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Update Interval').setCustomId(`${config.serverName}~board~${boardType}~updateInterval`).addOptions(util.boards.current.updateIntervals))];
      }
      await interaction.update({
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
      await interaction.update({
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
               boardList['current'][msg.id] = boardData;
               fs.writeFileSync('./config/boards.json', JSON.stringify(boardList));
               //Start cron job
               try {
                  const boardJob = schedule.scheduleJob(msg.id, boardData.updateInterval, function () {
                     module.exports.runBoardCron(client, msg.id, 'current');
                  });
               } catch (err) {
                  console.log(err);
               }
               //Run first time
               module.exports.runBoardCron(client, msg.id, 'current');
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
         await interaction.channel.send({
               embeds: [new EmbedBuilder().setTitle(boardData.title).setDescription(`Board will be created soon...`)]
            }).catch(console.error)
            .then(msg => {
               boardList['history'][msg.id] = boardData;
               fs.writeFileSync('./config/boards.json', JSON.stringify(boardList));
               //Start cron job
               try {
                  const boardJob = schedule.scheduleJob(msg.id, boardData.updateInterval, function () {
                     module.exports.runBoardCron(client, msg.id, 'history');
                  });
               } catch (err) {
                  console.log(err);
               }
               //Run first time
               module.exports.runBoardCron(client, msg.id, 'history');
            });
      } //End of history
      else if (boardType === 'raid') {
         var boardData = {};
         boardData.type = 'raid';
         boardData.channelID = interaction.message.channel.id;
         boardData.area = boardFields[1]['value'];
         boardData.tiers = boardFields[2]['value'].split('\n');
         boardData.eggs = boardFields[3]['value'] == "true" ? true : false;
         boardData.title = `${translations.Tier} ${boardData.tiers.join(' + ')} ${translations.Raids}`;
         boardData.updateInterval = `*/${boardFields[4]['value'].replace('every ', '').replace(' minutes', '')} * * * *`;
         boardData.geofence = await module.exports.generateGeofence(boardData.area);
         await interaction.channel.send({
               embeds: [new EmbedBuilder().setTitle(boardData.title).setDescription(`Board will be created soon...`)]
            }).catch(console.error)
            .then(msg => {
               boardList['raid'][msg.id] = boardData;
               fs.writeFileSync('./config/boards.json', JSON.stringify(boardList));
               //Start cron job
               try {
                  const boardJob = schedule.scheduleJob(msg.id, boardData.updateInterval, function () {
                     module.exports.runBoardCron(client, msg.id, 'raid');
                  });
               } catch (err) {
                  console.log(err);
               }
               //Run first time
               module.exports.runBoardCron(client, msg.id, 'raid');
            });
      } //End of raid
      await interaction.update({
         content: `Board created!`,
         embeds: [],
         components: []
      }).catch(console.error);
      await interaction.deleteReply().catch(console.error);
   }, //End of startNewBoard()


   runBoardCron: async function runBoardCron(client, messageID, boardType) {
      let boardList = JSON.parse(fs.readFileSync('./config/boards.json'));
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
      var boardDescriptionEggs = [];
      var boardMessage;
      var boardInfo;
      var footerText;
      var eggBoardCheck = false;
      let footerFormatDate = config.raidBoardOptions.useDayMonthYear == true ? 'DD/MM/YY' : 'MM/DD/YY';
      let footerFormatTime = config.raidBoardOptions.use24Hour == true ? 'H:mm:ss' : 'h:mm:ss A';
      let footerFormat = `${footerFormatDate}, ${footerFormatTime}`;
      //Curent boards
      if (boardType === 'current') {
         for (const [msgID, boardData] of Object.entries(boardList.current)) {
            if (messageID !== msgID) {
               continue;
            }
            boardInfo = boardData;
            let boardChannel = await client.channels.cache.get(boardData.channelID);
            try {
               boardMessage = await boardChannel.messages.fetch(messageID);
            } catch (err) {
               console.log(`Board message ${messageID} not found.`);
               return;
            }
            //Pokemon options
            if (boardData.pokemonOptions) {
               if (boardData.pokemonOptions[0] !== 'None') {
                  for (var i in boardData.pokemonOptions) {
                     var query = util.queries[boardData.pokemonOptions[i]]['query'].replace('{{queryName}}', boardData.pokemonOptions[i]).replace('{{area}}', boardData.geofence).replace('{{offset}}', config.timezoneOffsetHours);
                     let queryResult = await runQuery(query);
                     let translationTemplate = Handlebars.compile(util.queries[boardData.pokemonOptions[i]]['label']);
                     let labelText = translationTemplate(translations);
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
                     var query = util.queries[boardData.gymOptions[i]]['query'].replace('{{queryName}}', boardData.gymOptions[i]).replace('{{area}}', boardData.geofence).replace('{{offset}}', config.timezoneOffsetHours);
                     let queryResult = await runQuery(query);
                     //Single result queries
                     if (boardData.gymOptions[i] === 'current_total_gyms' || boardData.gymOptions[i] === 'current_battling' || boardData.gymOptions[i] === 'current_total_raids' || boardData.gymOptions[i] === 'current_total_eggs') {
                        let translationTemplate = Handlebars.compile(util.queries[boardData.gymOptions[i]]['label']);
                        let labelText = translationTemplate(translations);
                        boardDescription.push(`${labelText}: **${Object.values(queryResult[0]) ? Object.values(queryResult[0]) : 0}**`);
                     }
                     //Multi result queries
                     else if (boardData.gymOptions[i] === 'current_gym_teams') {
                        queryResult.forEach(function (gym) {
                           boardTable.cell(translations.Mystic, gym.Mystic ? gym.Mystic : 0);
                           boardTable.cell(translations.Valor, gym.Valor ? gym.Valor : 0);
                           boardTable.cell(translations.Instinct, gym.Instinct ? gym.Instinct : 0);
                           boardTable.cell(translations.Neutral, gym.Neutral ? gym.Neutral : 0);
                           boardTable.newRow();
                        });
                        boardDescription.push(`${`\``}${boardTable.toString()}${`\``}`);
                     } else if (boardData.gymOptions[i] === 'current_raid_tiers' || boardData.gymOptions[i] === 'current_egg_tiers') {
                        for (var i = 1; i < 10; i++) {
                           if (queryResult[0][`tier_${i}`] != 0) {
                              boardTable.cell(`${translations.Tier} ${i}`, queryResult[0][`tier_${i}`] ? queryResult[0][`tier_${i}`] : 0);
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
                     let translationTemplate = Handlebars.compile(util.queries[boardData.pokestopOptions[i]]['label']);
                     let labelText = translationTemplate(translations);
                     var boardTable = new Table;
                     var query = util.queries[boardData.pokestopOptions[i]]['query'].replace('{{queryName}}', boardData.pokestopOptions[i]).replace('{{area}}', boardData.geofence).replace('{{offset}}', config.timezoneOffsetHours);
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
                           boardTable.cell(translations.Normal, queryResult[0][`normal`] ? queryResult[0][`normal`] : 0);
                        }
                        if (queryResult[0][`glacial`] != 0) {
                           boardTable.cell(translations.Glacial, queryResult[0][`glacial`] ? queryResult[0][`glacial`] : 0);
                        }
                        if (queryResult[0][`mossy`] != 0) {
                           boardTable.cell(translations.Mossy, queryResult[0][`mossy`] ? queryResult[0][`mossy`] : 0);
                        }
                        if (queryResult[0][`magnetic`] != 0) {
                           boardTable.cell(translations.Magnetic, queryResult[0][`magnetic`] ? queryResult[0][`magnetic`] : 0);
                        }
                        if (queryResult[0][`rainy`] != 0) {
                           boardTable.cell(translations.Rainy, queryResult[0][`rainy`] ? queryResult[0][`rainy`] : 0);
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
            let geoSplit = boardData.geofence.split(',');
            let geoStart = geoSplit[0].split(' ');
            let tzName = find(geoStart[0].replace('(', ''), geoStart[1]);
            footerText = boardData.area == '~everywhere~' ? `${boardInfo.area.replaceAll('~','').replaceAll('\n\n\n','\n\n')} ~ ${moment().add(config.timezoneOffsetHours, 'hours').format(footerFormat)}` : `${boardInfo.area} ~ ${moment().tz(tzName[0]).format(footerFormat)}`;
         } //End of currentLoop
      } //End of current boards

      //History boards
      else if (boardType === 'history') {
         for (const [msgID, boardData] of Object.entries(boardList.history)) {
            if (messageID !== msgID) {
               continue;
            }
            boardInfo = boardData;
            let boardChannel = await client.channels.cache.get(boardData.channelID);
            try {
               boardMessage = await boardChannel.messages.fetch(messageID);
            } catch (err) {
               console.log(`Board message ${messageID} not found.`);
               return;
            }
            for (var i in boardData.historyOptions) {
               let query = util.queries[boardData.historyOptions[i]]['query'].replace('{{interval}}', boardData.historyLength).replace('{{offset}}', config.timezoneOffsetHours);
               let queryResult = await runQuery(query);
               let translationTemplate = Handlebars.compile(util.queries[boardData.historyOptions[i]]['label']);
               let labelText = translationTemplate(translations);
               let resultValue = Number(Object.values(queryResult[0])).toLocaleString();
               boardDescription.push(`${labelText}: **${resultValue}**\n`);
            } //End of i loop
            boardDescription.push(' ');
            footerText = `${moment().add(config.timezoneOffsetHours, 'hours').format(footerFormat)}`;
         } //End of history loop
      } //End of history boards

      //Raid boards
      else if (boardType === 'raid') {
         for (const [msgID, boardData] of Object.entries(boardList.raid)) {
            if (messageID !== msgID) {
               continue;
            }
            boardInfo = boardData;
            let boardChannel = await client.channels.cache.get(boardData.channelID);
            try {
               boardMessage = await boardChannel.messages.fetch(messageID);
            } catch (err) {
               console.log(`Board message ${messageID} not found.`);
               return;
            }
            let queryRaids = util.queries.raids.query.replace('{{tiers}}', boardInfo.tiers.join(',')).replace('{{area}}', boardInfo.geofence);
            let queryEggs = util.queries.eggs.query.replace('{{tiers}}', boardInfo.tiers.join(',')).replace('{{area}}', boardInfo.geofence);
            let raidResult = await runQuery(queryRaids);
            let eggResult = boardData.eggs == true ? await runQuery(queryEggs) : [];
            eggBoardCheck = boardData.eggs == true ? true : false;
            let updatedBoard = await module.exports.updateRaidBoard(boardInfo, raidResult, eggResult);
            boardDescription.push(updatedBoard.raids);
            boardDescriptionEggs.push(updatedBoard.eggs);
            let geoSplit = boardData.geofence.split(',');
            let geoStart = geoSplit[0].split(' ');
            let tzName = find(geoStart[0].replace('(', ''), geoStart[1]);
            footerText = boardData.area == '~everywhere~' ? `${boardInfo.area.replaceAll('~','')} ~ ${moment().add(config.timezoneOffsetHours, 'hours').format(footerFormat)}` : `${boardInfo.area} ~ ${moment().tz(tzName[0]).format(footerFormat)}`;
         } //End of history loop
      } //End of raid boards
      if (!boardInfo) {
         console.log(`Board message ${messageID} not found.`);
         return;
      }
      try {
         let translationTemplate = Handlebars.compile(boardDescription.join('\n\n'));
         var translatedBoard = translationTemplate(translations).replaceAll(',**', '**');
         var boardEmbeds = [new EmbedBuilder().setTitle(boardInfo.title).setDescription(translatedBoard).setFooter({
            text: footerText
         })];
         if (eggBoardCheck == true) {
            let translationEggTemplate = Handlebars.compile(boardDescriptionEggs.join('\n\n'));
            let translatedEggBoard = translationEggTemplate(translations).replaceAll(',[', '[');
            boardEmbeds.push(new EmbedBuilder().setTitle(`${translations.Tier} ${boardInfo.tiers.join(' + ')} ${translations.Eggs}`).setDescription(translatedEggBoard).setFooter({
               text: footerText
            }))
         }
         boardMessage.edit({
            content: ``,
            embeds: boardEmbeds
         }).catch(console.error);
      } catch (err) {
         console.log("Failed to update raid board:", err);
      }
   }, //End of runBoardCron()


   startHistoryBoard: async function startHistoryBoard(interaction) {
      var newEmbed = new EmbedBuilder().setTitle(`Creating History Stat Board:`).addFields({
         name: 'Board Type:',
         value: 'history'
      });
      var componentList = [];
      componentList.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setCustomId(`${config.serverName}~board~history~addOptions`).setPlaceholder('Select stat history options').addOptions(util.boards.history.historyOptions).setMaxValues(util.boards.history.historyOptions.length)));
      await interaction.reply({
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
      await interaction.update({
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
      await interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addHistoryLength()


   startRaidBoard: async function startRaidBoard(interaction) {
      var newEmbed = new EmbedBuilder().setTitle(`Creating Raid Board:`).addFields({
         name: 'Board Type:',
         value: 'raid'
      }).addFields({
         name: 'Area Name:',
         value: interaction.options._hoistedOptions[0]['value']
      });
      this.addRaidArea(interaction, newEmbed);
   }, //End of startRaidBoard()


   addRaidArea: async function addRaidArea(interaction, newEmbed) {
      var componentList = [];
      componentList.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setCustomId(`${config.serverName}~board~raid~addTiers`).setPlaceholder('Select raid tiers').addOptions(util.boards.raid.raidTiers).setMaxValues(util.boards.raid.raidTiers.length)));
      await interaction.reply({
         embeds: [newEmbed],
         components: componentList,
         ephemeral: true
      }).catch(console.error);
   }, //End of addRaidArea()


   addRaidTiers: async function addRaidTiers(interaction, tiers) {
      let oldEmbed = interaction.message.embeds[0]['data'];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'Tiers:',
         value: tiers.join('\n')
      });
      let newComponents = [new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Include Eggs?').setCustomId(`${config.serverName}~board~raid~addEggs`).addOptions({
         label: "True",
         value: "true"
      }, {
         label: "False",
         value: "false"
      }))];
      await interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addRaidTiers()


   addRaidEggs: async function addRaidEggs(interaction, includeEggs) {
      let oldEmbed = interaction.message.embeds[0]['data'];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'Eggs:',
         value: includeEggs
      });
      let newComponents = [new ActionRowBuilder().addComponents(new SelectMenuBuilder().setPlaceholder('Select Update Interval').setCustomId(`${config.serverName}~board~raid~updateInterval`).addOptions(util.boards.current.updateIntervals))];
      await interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addRaidEggs()


   addRaidUpdateInterval: async function addRaidUpdateInterval(interaction, updateInterval) {
      let oldEmbed = interaction.message.embeds[0]['data'];
      var newEmbed = new EmbedBuilder().setTitle(oldEmbed.title).addFields(oldEmbed['fields']);
      newEmbed.addFields({
         name: 'Update Interval:',
         value: `every ${updateInterval.replace('*/','').replaceAll(' *','')} minutes`
      });
      //Add verify buttons
      let newComponents = [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Start').setCustomId(`${config.serverName}~board~start`).setStyle(ButtonStyle.Success), new ButtonBuilder().setLabel('Restart').setCustomId(`${config.serverName}~board~raid~restart`).setStyle(ButtonStyle.Secondary), new ButtonBuilder().setLabel('Cancel').setCustomId(`${config.serverName}~board~cancel`).setStyle(ButtonStyle.Danger))];
      await interaction.update({
         embeds: [newEmbed],
         components: newComponents,
         ephemeral: true
      }).catch(console.error);
   }, //End of addRaidUpdateInterval()


   updateRaidBoard: async function updateRaidBoard(boardInfo, raids, eggs) {
      let masterfile = await JSON.parse(fs.readFileSync('./masterfile.json'));
      let monsters = masterfile.monsters;
      let moves = masterfile.moves;
      let raidBoardInfo = raids != '' ? await createRaidBoard(raids) : [translations.No_Raids];
      let eggBoardInfo = eggs != '' ? await createEggBoard(eggs) : translations.No_Eggs ? [translations.No_Eggs] : "Currently no eggs. Check back later.";
      async function createRaidBoard(raids) {
         var raidInfo = [];
         for (var r in raids) {
            try {
               var nameID = `${raids[r]['raid_pokemon_id']}_${raids[r]['raid_pokemon_form']}`;
               let monInfo = monsters[nameID] ? monsters[nameID] : monsters[`${raids[r]['raid_pokemon_id']}_0`];
               var monName = monInfo['name'];
               var monForm = monInfo['form']['name'];
               if (locale[monName]) {
                  monName = locale[monName];
               }
               if (monForm != 'Normal') {
                  if (locale[monForm]) {
                     monName = monName.concat(` ${locale[monForm]}`);
                  } else {
                     monName = monName.concat(` ${monForm}`);
                  }
               }
               var monTypes = translations[`${monInfo['types'][0]['name'].toLowerCase()}Emoji`];
               if (monInfo['types'][1]) {
                  monTypes = monTypes.concat(translations[`${monInfo['types'][1]['name'].toLowerCase()}Emoji`])
               }
               var move1 = moves[raids[r].raid_pokemon_move_1] ? `${moves[raids[r].raid_pokemon_move_1]['name']}` : '?';
               if (move1 !== '?') {
                  if (locale[move1]) {
                     move1 = locale[move1];
                  }
               }
               move1 = move1.concat(` ${translations[`${moves[raids[r].raid_pokemon_move_1]['type'].toLowerCase()}Emoji`]}`);
               var move2 = moves[raids[r].raid_pokemon_move_2] ? `${moves[raids[r].raid_pokemon_move_2]['name']}` : '?';
               if (move2 !== '?') {
                  if (locale[move2]) {
                     move2 = locale[move2];
                  }
               }
               move2 = move2.concat(` ${translations[`${moves[raids[r].raid_pokemon_move_2]['type'].toLowerCase()}Emoji`]}`);
               var gymName = raids[r]['name'] ? raids[r]['name'].length > 30 ? `${raids[r]['name'].slice(0, 28)}..` : raids[r]['name'] : translations.Unknown
               if (config.raidBoardOptions.mapLink == true) {
                  gymName = `[${gymName}](${config.raidBoardOptions.linkFormat.replace('{{lat}}',raids[r]['lat'].toFixed(4)).replace('{{lon}}',raids[r]['lon'].toFixed(4))})`;
               }
               if (config.raidBoardOptions.gymTeamEmoji == true) {
                  let gymEmoji = raids[r]['team_id'] == 1 ? translations.mysticEmoji : raids[r]['team_id'] == 2 ? translations.valorEmoji : raids[r]['team_id'] == 3 ? translations.instinctEmoji : translations.neutralEmoji;
                  gymName = gymName.concat(` ${gymEmoji}`);
               }
               raidInfo.push(`**${monName}** ${monTypes} *(${move1}/${move2})*\n${gymName} (${translations.Ends} <t:${raids[r]['raid_end_timestamp']}:R>)\n\n`);
               if (raidInfo.join('\n\n').length > 2900) {
                  raidInfo.pop();
                  break;
               }
            } catch (err) {
               console.log(`Error collecting raid data: ${err}`);
            }
         } //End of r loop
         return raidInfo;
      } //End of createRaidBoard()

      async function createEggBoard(eggs) {
         var eggInfo = [];
         let tzName = find(eggs[0]['lat'], eggs[0]['lon']);
         for (var e in eggs) {
            try {
               var gymName = eggs[e]['name'] ? eggs[e]['name'].length > 30 ? `${eggs[e]['name'].slice(0, 28)}..` : eggs[e]['name'] : translations.Unknown
               if (config.raidBoardOptions.mapLink == true) {
                  gymName = `[${gymName}](${config.raidBoardOptions.linkFormat.replace('{{lat}}', eggs[e]['lat'].toFixed(4)).replace('{{lon}}',eggs[e]['lon'].toFixed(4))})`;
               }
               if (config.raidBoardOptions.gymTeamEmoji == true) {
                  let gymEmoji = eggs[e]['team_id'] == 1 ? translations.mysticEmoji : eggs[e]['team_id'] == 2 ? translations.valorEmoji : eggs[e]['team_id'] == 3 ? translations.instinctEmoji : translations.neutralEmoji;
                  gymName = gymName.concat(` ${gymEmoji}`);
               }
               let formatTime = config.raidBoardOptions.use24Hour == true ? 'H:mm:ss' : 'h:mm:ss A';
               eggInfo.push(`${gymName}\n${moment.unix(eggs[e]['raid_battle_timestamp']).tz(tzName[0]).format(formatTime)} (<t:${eggs[e]['raid_battle_timestamp']}:R>)\n\n`);
               if (eggInfo.join('\n\n').length > 2900) {
                  eggInfo.pop();
                  break;
               }
            } catch (err) {
               console.log(`Error collecting egg data: ${err}`);
            }
         } //End of e loop
         return eggInfo;
      } //End of createEggBoard()
      let gymBoards = {
         raids: raidBoardInfo,
         eggs: eggBoardInfo
      }
      return gymBoards;
   }, //End of updateRaidBoard()

   generateGeofence: async function generateGeofence(areaName) {
      var geofence = [];
      if (areaName === '~everywhere~') {
         geofence = ["90.0 -180.0", "90.0 180.0", "-90.0 180.0", "-90.0 -180.0", "90.0 -180.0"];
      } else {
         //geojson
         if (geoConfig.features) {
            for (var f in geoConfig.features) {
               if (geoConfig.features[f]['properties']['name'] === areaName) {
                  for (var c in geoConfig.features[f]['geometry']['coordinates'][0]) {
                     let coord = geoConfig.features[f]['geometry']['coordinates'][0][c]
                     geofence.push(`${coord[1]} ${coord[0]}`);
                  } //End of c loop
               }
            } //End of f loop
         }
         //geo.jasparke
         else {
            for (var g in geoConfig) {
               if (geoConfig[g]['name'] === areaName) {
                  for (var p in geoConfig[g]['path']) {
                     geofence.push(`${geoConfig[g]['path'][p][0]} ${geoConfig[g]['path'][p][1]}`);
                  }
                  break;
               }
            } //End of g loop
            geofence.push(`${geoConfig[g]['path'][0][0]} ${geoConfig[g]['path'][0][1]}`);
         }
      }
      if (geofence !== []) {
         geofence = `(${geofence.join(', ')})`;
      }
      return geofence;
   }, //End of generateGeofence()


   updateBoardFormat: async function updateBoardFormat(oldBoards) {
      var currentBoards = {};
      var historyBoards = {};
      for (const [msgID, boardData] of Object.entries(oldBoards)) {
         if (boardData['type'] === 'current') {
            currentBoards[msgID] = boardData;
         } else if (boardData['type'] === 'history') {
            historyBoards[msgID] = boardData;
         }
      }
      let newBoards = {
         "current": currentBoards,
         "history": historyBoards,
         "raid": {}
      }
      fs.writeFileSync('./config/boards.json', JSON.stringify(newBoards));
      return newBoards;
   }, //End of updateBoardFormat()


   deleteBoard: async function deleteBoard(client, interaction, boardID) {
      var Boards = require('../config/boards.json');
      for (const [typeKey, boardList] of Object.entries(Boards)) {
         if (Boards[typeKey][boardID]) {
            try {
               let boardChannel = await client.channels.cache.get(Boards[typeKey][boardID]['channelID']);
               try {
                  let boardMessage = await boardChannel.messages.fetch(boardID);
                  boardDelete(boardChannel, boardMessage, Boards[typeKey][boardID]['type']);
               } catch (err) {
                  console.log("Unable to fetch board message for board deletion:", err);
               }
            } catch (err) {
               console.log("Unable to fetch board channel for board deletion:", err);
            }
         }
      } //End of board loop

      async function boardDelete(boardChannel, boardMessage, type) {
         console.log(`${interaction.user.username} deleted ${type} board ${boardID}`);
         //Delete cron
         try {
            let boardJob = schedule.scheduledJobs[boardMessage.id];
            boardJob.cancel();
         } catch (err) {
            console.log(`Failed to remove cron job for board ${boardMessage.id}: ${err}`);
         }
         //Delete message
         setTimeout(() => boardMessage.delete().catch(err => console.log(`Error deleting board message:`, err)), (1));
         //Delete from boards.json
         try {
            delete Boards[type][boardID];
            fs.writeFileSync('./config/boards.json', JSON.stringify(Boards));
            await interaction.reply({
               content: `${type.replace('raid','Raid').replace('history','History').replace('current','Current')} board \`${boardID}\` deleted`,
               ephemeral: true
            }).catch(console.error);
         } catch (err) {
            console.log(`Failed to remove ${type} board from config: ${err}`);
         }
      } //End of boardDelete()
   }, //End of deleteBoard()
}