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
const fs = require('fs');
const pm2 = require('pm2');
const shell = require('shelljs');
const ansiParser = require("ansi-parser");
const config = require('../config/config.json');
const queryConfig = require('../config/queries.json');
const scriptConfig = require('../config/scripts.json');
const Pm2Buttons = require('./pm2.js');
const Scripts = require('./scripts.js');
const Queries = require('./queries.js');
const Devices = require('./devices.js');

module.exports = {
   listInteraction: async function listInteraction(interaction, interactionID, userPerms) {
      //Scripts
      if (userPerms.includes('scripts') || userPerms.includes('admin')) {
         if (interactionID === 'scriptList') {
            let intValues = interaction.values[0].replace(`${config.serverName}~startScript~`, '').split('~');
            let scriptName = intValues[0];
            let variableCount = intValues[1] * 1;
            for (var s in scriptConfig) {
               if (scriptName === scriptConfig[s]['customName'] && scriptConfig[s]['fullFilePath']) {
                  Scripts.startScript(interaction, userPerms, scriptConfig[s], scriptName, variableCount);
               }
            }
         } else if (interactionID.startsWith('runScript')) {
            if (interaction.values[0] === `${config.serverName}~cancelScript`) {
               interaction.deferUpdate();
               Scripts.sendScriptList(interaction, 'restart');
            } else {
               Scripts.scriptVariables(interaction, userPerms);
            }
         }
      } //End of Scripts

      //Queries
      if (userPerms.includes('queries') || userPerms.includes('admin')) {
         if (interactionID === 'queryList') {
            let queryName = interaction.values[0].replace(`${config.serverName}~customQuery~`, '');
            interaction.update({});
            for (var i in queryConfig.custom){
               if (queryConfig.custom[i]['name'] === queryName){
                  Queries.customQuery(interaction.message.channel, interaction.user, queryName, queryConfig.custom[i]['query']);
               }
            }//End of i loop
         }
      } //End of queries


   }, //End of listInteraction()


   buttonInteraction: async function buttonInteraction(interaction, interactionID, userPerms) {
      //PM2
      if (userPerms.includes('pm2') || userPerms.includes('admin')) {
         pm2MenuButtons = ["restart", "start", "stop"];
         if (pm2MenuButtons.includes(interactionID)) {
            interaction.deferUpdate();
            Pm2Buttons.pm2MainMenu(interaction, interactionID)
         }
         //Status menu pressed
         else if (interactionID === 'status') {
            interaction.deferUpdate();
            Pm2Buttons.updateStatus(interaction, 'edit');
         }
         //Run PM2 process
         else if (interactionID.startsWith('process~')) {
            interaction.deferUpdate();
            Pm2Buttons.runPM2(interaction.message.channel, interaction.user, interactionID.replace('process~', ''));
         }
      } //End of pm2

      //Scripts
      if (userPerms.includes('scripts') || userPerms.includes('admin')) {
         if (interactionID.startsWith('verifyScript~')) {
            var scriptName = interaction.message.content.replace('Run script: ', '');
            //Check if admin only
            if (interaction.message.content.endsWith('🔒')) {
               scriptName = scriptName.replace('? 🔒', '');
               if (!userPerms.includes('admin')) {
                  console.log(`Non-admin ${interaction.user.username} tried to verify running ${scriptName}`);
                  return;
               }
            } else {
               scriptName = scriptName.slice(0, -1);
            }
            interaction.deferUpdate();
            let runScript = interactionID.replace('verifyScript~', '');
            if (runScript === 'no') {
               Scripts.sendScriptList(interaction, 'restart');
               interaction.message.channel.send({
                     content: '**Did not run script:**',
                     embeds: [new EmbedBuilder().setDescription(interaction.message.embeds[0]['description']).setColor('9E0000').setFooter({
                        text: `${interaction.user.username}`
                     })],
                     components: []
                  }).catch(console.error)
                  .then(msg => {
                     setTimeout(() => msg.delete().catch(err => console.log("Error deleting verify script message:", err)), 10000);
                  })
            } //End of no
            else if (runScript === 'yes') {
               let fullBashCommand = interaction.message.embeds[0]['description'];
               interaction.message.edit({
                  content: '**Running script:**',
                  embeds: [new EmbedBuilder().setDescription(`\`${fullBashCommand}\``).setColor('0D00CA').setFooter({
                     text: `${interaction.user.username}`
                  })],
                  components: []
               }).catch(console.error);
               try {
                  shell.exec(fullBashCommand, function (exitCode, output) {
                     Scripts.sendScriptList(interaction, "restart");
                     var color = '00841E';
                     var description = `${interaction.message.embeds[0]['description']}\n\n**Response:**\n${ansiParser.removeAnsi(output).replaceAll('c','')}`;
                     if (exitCode !== 0) {
                        color = '9E0000';
                        description = `${interaction.message.embeds[0]['description']}\n\n**Error Response:**\n${ansiParser.removeAnsi(output).replaceAll('c','')}`;
                     }
                     console.log(`${interaction.user.username} ran script: \`${fullBashCommand}\``);
                     interaction.message.channel.send({
                           content: '**Ran script:**',
                           embeds: [new EmbedBuilder().setDescription(description).setColor(color).setFooter({
                              text: `${interaction.user.username}`
                           })],
                           components: []
                        }).catch(console.error)
                        .then(msg => {
                           if (config.scripts.scriptResponseDeleteSeconds > 0) {
                              setTimeout(() => msg.delete().catch(err => console.log(`(${interaction.user.username}) Error deleting script response message:`, err)), (config.scripts.scriptResponseDeleteSeconds * 1000));
                           }
                        })
                  });
               } catch (err) {
                  console.log(`(${interaction.user.username}) Failed to run script: ${fullBashCommand}:`, err);
                  Scripts.sendScriptList(interaction, "restart");
                  interaction.message.channel.send({
                        embeds: [new EmbedBuilder().setTitle('Failed to run script:').setDescription(interaction.message.embeds[0]['description']).setColor('9E0000').setFooter({
                           text: `${interaction.user.username}`
                        })],
                        components: []
                     }).catch(console.error)
                     .then(msg => {
                        if (config.scripts.scriptResponseDeleteSeconds > 0) {
                           setTimeout(() => msg.delete().catch(err => console.log("Error deleting script response message:", err)), (config.scripts.scriptResponseDeleteSeconds * 1000));
                        }
                     })
               }
            } //End of yes
         }
      } //End of scripts

      //Devices
      if (userPerms.includes('deviceInfoControl') || userPerms.includes('deviceInfo') || userPerms.includes('admin')) {
         if (interactionID.startsWith('deviceInfo~')) {
            interaction.deferUpdate();
            let deviceID = interactionID.replace('deviceInfo~', '');
            Devices.getDeviceInfo(interaction.message.channel, interaction.user, deviceID);
         }
      } //End of devices
   }, //End of buttonInteraction()
}