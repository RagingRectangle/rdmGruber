const {
   ActionRowBuilder,
   SelectMenuBuilder,
   EmbedBuilder
} = require('discord.js');
var fs = require('fs');
var {
   find
} = require('geo-tz');
var moment = require('moment');
var mysql = require('mysql2');
var config = require('../config/config.json');
var master = require('../masterfile.json');
var util = require('../util.json');
var Boards = require('./boards.js');
var Roles = require('./roles.js');
var translations = require('../config/translations.json');
var serverInfo = require('../Server_Info.json');
var locale = require('../locale/en.json');
if (config.raidBoardOptions.language) {
   locale = require(`../locale/${config.raidBoardOptions.language}.json`);
}

module.exports = {
   updateQuests: async function updateQuests() {
      let dayStart = moment().startOf('day').format('X');
      let dayEnd = moment().endOf('day').format('X');
      let queries = util.queries.availableQuests;
      let allQuests = await this.runQuestQuery((`${queries.items} ${queries.xp} ${queries.stardust} ${queries.stickers} ${queries.pokemon} ${queries.megaEnergy} ${queries.candy} ${queries.items.replaceAll('quest_','alternative_quest_')} ${queries.xp.replaceAll('quest_','alternative_quest_')} ${queries.stardust.replaceAll('quest_','alternative_quest_')} ${queries.stickers.replaceAll('quest_','alternative_quest_')} ${queries.pokemon.replaceAll('quest_','alternative_quest_')} ${queries.megaEnergy.replaceAll('quest_','alternative_quest_')} ${queries.candy.replaceAll('quest_','alternative_quest_')}`).replaceAll(`{{dayStart}}`, dayStart).replaceAll(`{{dayEnd}}`, dayEnd));
      if (allQuests == 'ERROR') {
         return;
      }
      allQuests.shift();
      var buttonValues = [];
      var questList = {};

      //Items
      var itemList = [];
      async function itemButtons(quests) {
         for (var i in quests) {
            let value = `item~${quests[i]['itemID']}~${quests[i]['rewardAmount']}`;
            if (buttonValues.includes(value)) {
               continue;
            }
            let itemName = locale[master['items'][quests[i]['itemID']]['name']] ? locale[master['items'][quests[i]['itemID']]['name']] : master['items'][quests[i]['itemID']]['name'];
            itemList.push({
               label: `${itemName} x${quests[i]['rewardAmount']}`,
               value: value
            });
            buttonValues.push(value);
         } //End of i loop
      } //End of itemButtons()
      itemButtons(allQuests[0]);
      itemButtons(allQuests[7]);
      questList.items = itemList;

      //XP
      var xpList = [];
      async function xpButtons(quests) {
         let xpName = locale['XP'] ? locale['XP'] : 'XP';
         for (var x in quests) {
            let value = `xp~${quests[x]['rewardAmount']}`;
            if (buttonValues.includes(value)) {
               continue;
            }
            xpList.push({
               label: `${xpName} x${quests[x]['rewardAmount']}`,
               value: value
            });
            buttonValues.push(value);
         } //End of x loop
      } //End of xpButtons()
      xpButtons(allQuests[1]);
      xpButtons(allQuests[8]);
      questList.xp = xpList;

      //Stardust
      var stardustList = [];
      async function stardustButtons(quests) {
         let stardustName = locale['Stardust'] ? locale['Stardust'] : 'Stardust';
         for (var d in quests) {
            let value = `stardust~${quests[d]['rewardAmount']}`;
            if (buttonValues.includes(value)) {
               continue;
            }
            stardustList.push({
               label: `${stardustName} x${quests[d]['rewardAmount']}`,
               value: value
            });
            buttonValues.push(value);
         } //End of d loop
      } //End of stardustButtons()
      stardustButtons(allQuests[2]);
      stardustButtons(allQuests[9]);
      questList.stardust = stardustList;

      //Sticker
      var stickerList = [];
      async function stickerButtons(quests) {
         let stickerName = locale['Sticker'] ? locale['Sticker'] : 'Sticker';
         for (var s in quests) {
            let value = `sticker~${quests[s]['rewardAmount']}`;
            if (buttonValues.includes(value)) {
               continue;
            }
            stickerList.push({
               label: `${stickerName} x${quests[s]['rewardAmount']}`,
               value: value
            });
            buttonValues.push(value);
         } //End of s loop
      } //End of stickerButtons()
      stickerButtons(allQuests[3]);
      stickerButtons(allQuests[10]);
      questList.stickers = stickerList;

      //Pokemon
      var pokemonList = [];
      async function pokemonButtons(quests) {
         for (var p in quests) {
            let value = `pokemon~${quests[p]['pokemonID']}`;
            if (buttonValues.includes(value)) {
               continue;
            }
            let pokemonName = locale[master['monsters'][`${quests[p]['pokemonID']}_0`]['name']] ? locale[master['monsters'][`${quests[p]['pokemonID']}_0`]['name']] : master['monsters'][`${quests[p]['pokemonID']}_0`]['name'];
            pokemonList.push({
               label: pokemonName,
               value: value
            });
            buttonValues.push(value);
         } //End of p loop
      } //End of pokemonButtons();
      pokemonButtons(allQuests[4]);
      pokemonButtons(allQuests[11]);
      questList.pokemon = pokemonList;

      //MegaEnergy
      var megaEnergyList = [];
      async function energyButtons(quests) {
         let megaEnergyName = locale['Mega Energy'] ? locale['Mega Energy'] : 'Mega Energy';
         for (var m in quests) {
            let value = `megaEnergy~${quests[m]['pokemonID']}~${quests[m]['rewardAmount']}`;
            if (buttonValues.includes(value)) {
               continue;
            }
            let megaPokemonName = locale[master['monsters'][`${quests[m]['pokemonID']}_0`]['name']] ? locale[master['monsters'][`${quests[m]['pokemonID']}_0`]['name']] : master['monsters'][`${quests[m]['pokemonID']}_0`]['name'];
            megaEnergyList.push({
               label: `${megaEnergyName} ${megaPokemonName} x${quests[m]['rewardAmount']}`,
               value: value
            });
            buttonValues.push(value);
         } //End of m loop
      } //End of energyButtons()
      energyButtons(allQuests[5]);
      energyButtons(allQuests[12]);
      questList.megaEnergy = megaEnergyList;

      //Candy
      var candyList = [];
      async function candyButtons(quests) {
         let candyName = locale['Candy'] ? locale['Candy'] : 'Candy';
         for (var c in quests) {
            let value = `candy~${quests[c]['pokemonID']}~${quests[c]['rewardAmount']}`;
            if (buttonValues.includes(value)) {
               continue;
            }
            candyList.push({
               label: `${candyName} ${master['monsters'][`${quests[c]['pokemonID']}_0`]['name']} x${quests[c]['rewardAmount']}`,
               value: value
            });
            buttonValues.push(value);
         } //End of c loop
      } //End of candyButtons()
      candyButtons(allQuests[6]);
      candyButtons(allQuests[13]);
      questList.candy = candyList;

      fs.writeFileSync('./quests.json', JSON.stringify(questList));
   }, //End of updateQuests()


   generateAreaList: async function generateAreaList(client, interaction) {
      //Admins
      if (config.discord.adminIDs.includes(interaction.user.id)) {
         sendAreaList(serverInfo.geofenceList);
         return;
      }
      //Role check
      let userPerms = await Roles.getUserCommandPerms(interaction.member.guild, interaction.user);
      if (!userPerms.includes('quests')) {
         return;
      }
      //No role restrictions
      if (config.questBoardOptions.roleRestriction != true) {
         sendAreaList(serverInfo.geofenceList);
         return;
      }
      //Restrict areas
      var userGeofences = [];
      let guildUser = await interaction.member.guild.members.cache.find(u => u.id === interaction.user.id);
      for (const [roleID, roleFences] of Object.entries(config.questBoardOptions.questRoles)) {
         if (guildUser['_roles'].includes(roleID)) {
            for (var f in roleFences) {
               if (serverInfo.geofenceList.includes(roleFences[f])) {
                  userGeofences.push(roleFences[f]);
               }
            } //End of f loop
         }
      }
      userGeofences = [...new Set(userGeofences)];
      userGeofences.sort();
      if (userGeofences.length > 0) {
         sendAreaList(userGeofences);
      }

      async function sendAreaList(areaList) {
         let focusedValue = interaction.options.getFocused();
         var filteredList = areaList.filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase())).slice(0, 25);
         await interaction.respond(
            filteredList.map(choice => ({
               name: choice,
               value: choice
            }))
         ).catch(console.error);
      } //End of sendAreaList()
   }, //End of generateAreaList()


   getRewardType: async function getRewardType(client, interaction, areaName) {
      let questList = JSON.parse(fs.readFileSync('./quests.json'));
      var componentList = [];
      //Pokemon
      let pokeListsNeeded = Math.min(3, Math.ceil(questList.pokemon.length / 25));
      var pokeCount = 0;
      for (var p = 0; p < pokeListsNeeded; p++) {
         var listOptions = [];
         for (var i = 0; i < 25 && pokeCount < questList.pokemon.length; i++, pokeCount++) {
            listOptions.push(questList['pokemon'][pokeCount]);
         } //End of i loop
         componentList.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setCustomId(`${config.serverName}~quests~reward~${areaName}~p${p}`).setPlaceholder(translations['Pokemon']).addOptions(listOptions)));
      } //End of p loop

      //Items
      let itemListsNeeded = Math.min(2, Math.ceil(questList.items.length / 25));
      var itemCount = 0;
      for (var n = 0; n < itemListsNeeded; n++) {
         var listOptions = [];
         for (var i = 0; i < 25 && itemCount < questList.items.length; i++, itemCount++) {
            listOptions.push(questList['items'][itemCount]);
         } //End of i loop
         componentList.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setCustomId(`${config.serverName}~quests~reward~${areaName}~i${n}`).setPlaceholder(locale['Item'] ? locale['Item'] : 'Item').addOptions(listOptions)));
      } //End of n loop

      //Other
      let otherQuests = questList['candy'].concat(questList['megaEnergy'], questList['stardust'], questList['xp'], questList['stickers']);
      let otherListsNeeded = Math.min(2, Math.ceil(otherQuests.length / 25));
      var otherCount = 0;
      for (var o = 0; o < otherListsNeeded; o++) {
         var listOptions = [];
         for (var i = 0; i < 25 && otherCount < otherQuests.length; i++, otherCount++) {
            listOptions.push(otherQuests[otherCount]);
         } //End of i loop
         componentList.push(new ActionRowBuilder().addComponents(new SelectMenuBuilder().setCustomId(`${config.serverName}~quests~reward~${areaName}~o${o}`).setPlaceholder(translations['Other'] ? translations['Other'] : 'Other').addOptions(listOptions)));
      } //End of o loop
      await interaction.editReply({
         components: componentList
      }).catch(console.error);
   }, //End of getRewardType()


   getAreaQuests: async function getAreaQuests(client, interaction, geofenceName, rewardType) {
      await interaction.update({
         content: `Collecting quests...`,
         components: []
      }).catch(console.error);
      let dayStart = moment().startOf('day').format('X');
      let dayEnd = moment().endOf('day').format('X');
      let footerFormat = config.raidBoardOptions.useDayMonthYear == true ? 'DD/MM/YY' : 'MM/DD/YY';
      let geofenceArea = await Boards.generateGeofence(geofenceName);
      let rewardData = rewardType.split('~');
      var rewardName = '';
      var rewardPic = config.questBoardOptions.iconRepo ? config.questBoardOptions.iconRepo : "https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS";
      if (!rewardPic.endsWith('/')) {
         rewardPic = rewardPic.concat('/');
      }
      var questResults = [];
      if (rewardData[0] == 'item') {
         let itemType = rewardData[1];
         let itemAmount = rewardData[2];
         rewardName = locale[master['items'][itemType]['name']] ? locale[master['items'][itemType]['name']] : master['items'][itemType]['name'];
         rewardName = rewardName.concat(` x${itemAmount}`);
         rewardPic = rewardPic.concat(`reward/item/${itemType}_a${itemAmount}.png`).replace('_a1.png', '.png');
         let itemQuery = util.queries.areaQuests.items.replace('{{itemType}}', itemType).replace('{{itemAmount}}', itemAmount).replace('{{area}}', geofenceArea).replace('{{dayStart}}', dayStart).replace('{{dayEnd}}', dayEnd);
         questResults = await this.runQuestQuery(`${itemQuery} ${itemQuery.replaceAll('quest_', 'alternative_quest_')}`);
      } else if (rewardData[0] == 'xp') {
         let xpAmount = rewardData[1];
         rewardName = locale['XP'] ? locale['XP'] : 'XP';
         rewardName = rewardName.concat(` x${xpAmount}`);
         rewardPic = rewardPic.concat(`reward/experience/${xpAmount}.png`);
         let xpQuery = util.queries.areaQuests.xp.replace('{{xpAmount}}', xpAmount).replace('{{area}}', geofenceArea).replace('{{dayStart}}', dayStart).replace('{{dayEnd}}', dayEnd);
         questResults = await this.runQuestQuery(`${xpQuery} ${xpQuery.replaceAll('quest_', 'alternative_quest_')}`);
      } else if (rewardData[0] == 'stardust') {
         let stardustAmount = rewardData[1];
         rewardName = locale['Stardust'] ? locale['Stardust'] : 'Stardust';
         rewardName = rewardName.concat(` x${stardustAmount}`);
         rewardPic = rewardPic.concat(`reward/stardust/${stardustAmount}.png`);
         let stardustQuery = util.queries.areaQuests.stardust.replace('{{stardustAmount}}', stardustAmount).replace('{{area}}', geofenceArea).replace('{{dayStart}}', dayStart).replace('{{dayEnd}}', dayEnd);
         questResults = await this.runQuestQuery(`${stardustQuery} ${stardustQuery.replaceAll('quest_', 'alternative_quest_')}`);
      } else if (rewardData[0] == 'sticker') {
         console.log("Sticker quest error: Tell @RagingRectangle to add stickers!");
         return;
      } else if (rewardData[0] == 'pokemon') {
         let pokemonID = rewardData[1];
         rewardName = locale[master['monsters'][`${pokemonID}_0`]['name']] ? locale[master['monsters'][`${pokemonID}_0`]['name']] : master['monsters'][`${pokemonID}_0`]['name'];
         rewardPic = rewardPic.concat(`pokemon/${pokemonID}.png`);
         let pokemonQuery = util.queries.areaQuests.pokemon.replace('{{pokemonID}}', pokemonID).replace('{{area}}', geofenceArea).replace('{{dayStart}}', dayStart).replace('{{dayEnd}}', dayEnd);
         questResults = await this.runQuestQuery(`${pokemonQuery} ${pokemonQuery.replaceAll('quest_', 'alternative_quest_')}`);
      } else if (rewardData[0] == 'megaEnergy') {
         let pokemonID = rewardData[1];
         let energyAmount = rewardData[2];
         rewardName = locale[master['monsters'][`${pokemonID}_0`]['name']] ? locale[master['monsters'][`${pokemonID}_0`]['name']] : master['monsters'][`${pokemonID}_0`]['name'];
         rewardPic = rewardPic.concat(`reward/mega_resource/${pokemonID}.png`);
         rewardName = rewardName.concat(` x${energyAmount}`);
         let energyQuery = util.queries.areaQuests.megaEnergy.replace('{{pokemonID}}', pokemonID).replace('{{energyAmount}}', energyAmount).replace('{{area}}', geofenceArea).replace('{{dayStart}}', dayStart).replace('{{dayEnd}}', dayEnd);
         questResults = await this.runQuestQuery(`${energyQuery} ${energyQuery.replaceAll('quest_', 'alternative_quest_')}`);
      } else if (rewardData[0] == 'candy') {
         let pokemonID = rewardData[1];
         let candyAmount = rewardData[2];
         rewardName = locale[master['monsters'][`${pokemonID}_0`]['name']] ? locale[master['monsters'][`${pokemonID}_0`]['name']] : master['monsters'][`${pokemonID}_0`]['name'];
         rewardPic = rewardPic.concat(`reward/candy/${pokemonID}.png`);
         rewardName = rewardName.concat(` x${candyAmount}`);
         let candyQuery = util.queries.areaQuests.candy.replace('{{pokemonID}}', pokemonID).replace('{{candyAmount}}', candyAmount).replace('{{area}}', geofenceArea).replace('{{dayStart}}', dayStart).replace('{{dayEnd}}', dayEnd);
         questResults = await this.runQuestQuery(`${candyQuery} ${candyQuery.replaceAll('quest_', 'alternative_quest_')}`);
      }
      if (questResults.length != 2) {
         console.log(`Error retrieving current quests`);
         return;
      }
      console.log(`${interaction.user.username} requested ${rewardName} quests for ${geofenceName}`);
      if (questResults[0].length == 0 && questResults[1].length == 0) {
         let noneFoundEmbed = new EmbedBuilder().setTitle(`${rewardName} ${translations.AR} ${translations.Quests}:`).setThumbnail(rewardPic).setDescription(translations.noQuests ? translations.noQuests : 'No quests found!').setColor('Red').setFooter({
            text: `${geofenceName} ~ ${moment().add(config.timezoneOffsetHours, 'hours').format(footerFormat)}`
         });
         if (config.questBoardOptions.dmResponse == true) {
            await interaction.user.send({
               embeds: [noneFoundEmbed],
            }).catch(console.error);
         } else {
            await interaction.message.channel.send({
               embeds: [noneFoundEmbed],
            }).catch(console.error);
         }
      } else {
         let geoSplit = geofenceArea.split(',');
         let geoStart = geoSplit[0].split(' ');
         let tzName = find(geoStart[0].replace('(', ''), geoStart[1]);
         //Quests
         if (questResults[0].length > 0) {
            var embedList = [];
            var questList = [];
            for (var q in questResults[0]) {
               questList.push(`[${questResults[0][q]['name']}](${config.raidBoardOptions.linkFormat.replace('{{lat}}', questResults[0][q]['lat']).replace('{{lon}}', questResults[0][q]['lon'])})`);
               if (questList.join('\n').length > 3900 && q != questResults[0].length - 1) {
                  embedList.push(new EmbedBuilder().setDescription(questList.join('\n')));
                  questList = [];
               }
            }
            embedList.push(new EmbedBuilder().setDescription(questList.join('\n')));
            embedList.splice(4, embedList.length - 1);
            embedList[0].setTitle(`${rewardName} ${translations.AR} ${translations.Quests}:`).setThumbnail(rewardPic);
            embedList[embedList.length - 1].setFooter({
               text: `${geofenceName} ~ ${moment().tz(tzName[0]).format(footerFormat)}`
            });
            if (config.questBoardOptions.dmResponse == true) {
               await interaction.user.send({
                  embeds: embedList,
               }).catch(console.error);
            } else {
               await interaction.message.channel.send({
                  embeds: embedList,
               }).catch(console.error);
            }
         }
         //QuestsAlt
         if (questResults[1].length > 0) {
            var embedList = [];
            var questList = [];
            for (var q in questResults[1]) {
               questList.push(`[${questResults[1][q]['name']}](${config.raidBoardOptions.linkFormat.replace('{{lat}}', questResults[1][q]['lat']).replace('{{lon}}', questResults[1][q]['lon'])})`);
               if (questList.join('\n').length > 3900 && q != questResults[1].length - 1) {
                  embedList.push(new EmbedBuilder().setDescription(questList.join('\n')));
                  questList = [];
               }
            }
            embedList.push(new EmbedBuilder().setDescription(questList.join('\n')));
            embedList.splice(4, embedList.length - 1);
            embedList[0].setTitle(`${rewardName} ${translations.nonAR} ${translations.Quests}:`).setThumbnail(rewardPic);
            embedList[embedList.length - 1].setFooter({
               text: `${geofenceName} ~ ${moment().tz(tzName[0]).format(footerFormat)}`
            });
            if (config.questBoardOptions.dmResponse == true) {
               await interaction.user.send({
                  embeds: embedList,
               }).catch(console.error);
            } else {
               await interaction.message.channel.send({
                  embeds: embedList,
               }).catch(console.error);
            }
         }
         await interaction.deleteReply().catch(console.error);
      }
   }, //End of getAreaQuests()


   runQuestQuery: async function runQuestQuery(query) {
      var dbConfig = config.rdmDB;
      dbConfig.multipleStatements = true;
      let questConnection = mysql.createConnection(dbConfig);
      return new Promise((resolve, reject) => {
         questConnection.query(`${util.queries.dirtyRead} ${query}`, (error, results) => {
            if (error) {
               questConnection.end();
               console.log(error)
               return resolve(`ERROR`);
            }
            questConnection.end();
            return resolve(results);
         });
      });
   }, //End of runQuestQuery()
}