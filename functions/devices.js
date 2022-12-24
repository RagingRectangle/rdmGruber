var {
   ActionRowBuilder,
   EmbedBuilder,
   ButtonBuilder,
   ButtonStyle
} = require('discord.js');
var fs = require('fs');
var mysql = require('mysql2');
var moment = require('moment');
var config = require('../config/config.json');

module.exports = {
   deviceStatus: async function deviceStatus(channel, user) {
      console.log(`${user.username} requested the status of all devices`);
      var db = config.rdmDB;
      db.multipleStatements = true;
      let connection = mysql.createConnection(db);
      let instanceQuery = `SELECT DISTINCT(type) FROM instance; SELECT a.uuid 'uuid', a.instance_name 'instance', a.last_host 'ip', a.last_seen 'last_seen', a.account_username 'username', a.last_lat 'lat', a.last_lon 'lon', b.type 'type' FROM device a, instance b WHERE a.instance_name = b.name order by a.uuid;`;

      connection.query(instanceQuery, function (err, results) {
         if (err) {
            console.log("Device status query error:", err);
         } else {
            for (var t in results[0]) {
               let type = results[0][t]['type'];
               var typeDeviceList = [];
               for (var d in results[1]) {
                  let device = results[1][d];
                  if (device.type === type) {
                     typeDeviceList.push({
                        uuid: device.uuid,
                        minutesSinceSeen: ((Math.abs(Date.now() - (device.last_seen * 1000)) / (1000 * 3600)) * 60).toFixed(0)
                     });
                  } //End of type match
               } //End of d loop
               if (typeDeviceList.length > 0) {
                  createDeviceButtons(type, typeDeviceList);
               }
            } //End of t loop
         }
      }); //End of query()
      connection.end();

      async function createDeviceButtons(type, deviceList) {
         var deviceButtonList = [];
         for (var d in deviceList) {
            let minutesSinceSeen = deviceList[d]['minutesSinceSeen'];
            let buttonID = `${config.serverName}~deviceInfo~${deviceList[d]['uuid']}`;
            let buttonStyle = minutesSinceSeen < config.devices.noProtoMinutes ? ButtonStyle.Success : ButtonStyle.Danger;
            var deviceName = deviceList[d]['uuid'];
            for (var n in config.devices.buttonLabelRemove) {
               if (deviceName.includes(config.devices.buttonLabelRemove[n])) {
                  deviceName = deviceName.replace(config.devices.buttonLabelRemove[n], '');
               }
            } //End of n loop
            var buttonLabel = deviceName;
            if (minutesSinceSeen >= config.devices.noProtoMinutes) {
               var timeSince = `${minutesSinceSeen}m`;
               if (Math.round(minutesSinceSeen) > 119) {
                  let hoursSince = (Math.round(minutesSinceSeen) / 60).toFixed(0);
                  timeSince = `${hoursSince}h`;
                  if (hoursSince > 47) {
                     let daysSince = (Math.round(hoursSince / 24)).toFixed(0);
                     timeSince = `${daysSince}d`;
                  }
               }
               buttonLabel = `${deviceName} (${timeSince})`;
            }
            let button = new ButtonBuilder().setCustomId(buttonID).setLabel(buttonLabel).setStyle(buttonStyle);
            deviceButtonList.push(button);
         } //End of d loop
         sendDeviceButtons(type, deviceButtonList);
      } //End of createDeviceButtons()

      async function sendDeviceButtons(type, deviceButtonList) {
         let messagesNeeded = Math.ceil(deviceButtonList.length / 25);
         var content = `**Status of ${type} Devices:**`;
         for (var m = 0; m < messagesNeeded; m++) {
            let buttonsNeeded = Math.min(25, deviceButtonList.length);
            let rowsNeeded = Math.ceil(buttonsNeeded / 5);
            var buttonCount = 0;
            var messageComponents = [];
            for (var n = 0; n < rowsNeeded && n < 5; n++) {
               var buttonRow = new ActionRowBuilder();
               for (var r = 0; r < 5; r++) {
                  if (buttonCount < buttonsNeeded) {
                     buttonRow.addComponents(deviceButtonList[buttonCount]);
                     buttonCount++;
                  }
               } //End of r loop
               messageComponents.push(buttonRow);
            } //End of n loop
            channel.send({
                  content: content,
                  components: messageComponents
               }).catch(console.error)
               .then(msg => {
                  if (config.devices.statusButtonsDeleteMinutes > 0) {
                     setTimeout(() => msg.delete().catch(err => console.log(`Error deleting device status message:`, err)), (config.devices.statusButtonsDeleteMinutes * 1000 * 60));
                  }
               });
            content = '‎';
            let tempButtons = deviceButtonList.slice(25);
            deviceButtonList = tempButtons;
         } //End of m loop
      } //End of sendDeviceButtons()
   }, //End of deviceStatus()


   getDeviceInfo: async function getDeviceInfo(channel, user, deviceID) {
      let connection = mysql.createConnection(config.rdmDB);
      let deviceQuery = `SELECT a.uuid 'uuid', a.instance_name 'instance', a.last_host 'ip', a.last_seen 'last_seen', a.account_username 'username', a.last_lat 'lat', a.last_lon 'lon', b.type 'type' FROM device a, instance b WHERE a.instance_name = b.name AND a.uuid = "${deviceID}";`;
      connection.query(deviceQuery, function (err, results) {
         if (err) {
            console.log("Error getting deviceInfo from database:", err);
         } else {
            if (results.length < 1) {
               channel.send(`Device \`${deviceID}\` not found in database.`).catch(console.error);
            } else {
               sendDeviceInfo(results[0]);
            }
         }
      }); //End of query
      connection.end();

      async function sendDeviceInfo(device) {
         let minutesSinceSeen = ((Math.abs(Date.now() - (device.last_seen * 1000)) / (1000 * 3600)) * 60).toFixed(0);
         let color = minutesSinceSeen < config.devices.noProtoMinutes ? '00841E' : '9E0000';
         var description = `**- Instance:** ${device.instance}\n**- Scan type:** ${device.type}\n**- Last seen:** ${moment(device.last_seen * 1000).from(moment())}`;
         config.devices.displayOptions.username ? description = description.concat(`\n**- Username:** ${device.username}`) : '';
         config.devices.displayOptions.lastHost ? description = description.concat(`\n**- Last host:** ${device.ip}`) : '';
         config.devices.displayOptions.location ? description = description.concat(`\n**- Location:** [${device.lat.toFixed(4)},${device.lon.toFixed(4)}](https://maps.google.com/?q=${device.lat},${device.lon})`) : '';
         channel.send({
               embeds: [new EmbedBuilder().setTitle(`${device.uuid} Info:`).setDescription(description).setColor(color).setFooter({
                  text: `${user.username}`
               })]
            }).catch(console.error)
            .then(msg => {
               if (config.devices.infoMessageDeleteSeconds > 0) {
                  setTimeout(() => msg.delete().catch(err => console.log(`Error deleting ${device.uuid} device message:`, err)), (config.devices.infoMessageDeleteSeconds * 1000));
               }
            });
      } //End of sendDeviceInfo()
   }, //End of getDeviceInfo


   noProtoDevices: async function noProtoDevices(client, channel, user, type) {
      if (type === 'cron' && !config.devices.noProtoChannelID) {
         console.log("Error: 'noProtoChannelID' not set in config.json");
         return;
      }
      if (type === 'search') {
         console.log(`${user.username} requested the status of all noProto devices`);
      }
      let lastSeenCutoff = (Date.now() / 1000) - (config.devices.noProtoMinutes * 60);
      let connection = mysql.createConnection(config.rdmDB);
      let ignoreQuestDevices = config.devices.noProtoIgnoreQuestDevices == true ? `AND b.type != 'auto_quest' ` : ``;
      let deviceQuery = `SELECT a.uuid, a.last_seen, b.type FROM device a, instance b WHERE last_seen < ${lastSeenCutoff} and uuid NOT IN ('${config.devices.noProtoIgnoreDevices.join("','")}') AND a.instance_name = b.name ${ignoreQuestDevices}ORDER BY uuid;`;
      connection.query(deviceQuery, function (err, results) {
         if (err) {
            console.log("noProto Status Query Error:", err);
         } else {
            if (results.length == 0 && type == 'search') {
               channel.send("No problems detected!")
                  .catch(console.error)
                  .then(msg => {
                     if (config.devices.statusButtonsDeleteMinutes > 0) {
                        setTimeout(() => msg.delete().catch(err => console.log(`Error deleting noProto status message:`, err)), (config.devices.statusButtonsDeleteMinutes * 1000 * 60));
                     }
                  });
            } else if (results.length > 0) {
               createNoProtoButtons(results);
            }
         }
      }); //End of query
      connection.end();

      async function createNoProtoButtons(deviceList) {
         var deviceButtonList = [];
         for (var d in deviceList) {
            var deviceName = deviceList[d]['uuid'];
            for (var n in config.devices.buttonLabelRemove) {
               if (deviceName.includes(config.devices.buttonLabelRemove[n])) {
                  deviceName = deviceName.replace(config.devices.buttonLabelRemove[n], '');
               }
            } //End of n loop
            let minutesSinceSeen = ((Math.abs(Date.now() - (deviceList[d].last_seen * 1000)) / (1000 * 3600)) * 60).toFixed(0);
            var timeSince = `${minutesSinceSeen}m`;
            if (Math.round(minutesSinceSeen) > 119) {
               let hoursSince = (Math.round(minutesSinceSeen) / 60).toFixed(0);
               timeSince = `${hoursSince}h`;
               if (hoursSince > 47) {
                  let daysSince = (Math.round(hoursSince / 24)).toFixed(0);
                  timeSince = `${daysSince}d`;
               }
            }
            let button = new ButtonBuilder().setCustomId(`${config.serverName}~deviceInfo~${deviceList[d]['uuid']}`).setLabel(`${deviceName} (${timeSince})`).setStyle(ButtonStyle.Danger);
            deviceButtonList.push(button);
         } //End of d loop
         sendNoProtoButtons(deviceButtonList);
      } //End of createNoProtoButtons()

      async function sendNoProtoButtons(deviceButtonList) {
         var noProtoChannel = channel;
         var userTags = [];
         if (type == 'cron') {
            try {
               noProtoChannel = await client.channels.fetch(config.devices.noProtoChannelID);
               if (config.devices.noProtoAlertUsers){
                  for (u in config.devices.noProtoAlertUsers){
                     userTags.push(`<@${config.devices.noProtoAlertUsers[u]}>`);
                  }
               }
            } catch (err) {
               console.log("Failed to fetch noProto post channel:", err);
               return;
            }
         }
         let messagesNeeded = Math.ceil(deviceButtonList.length / 25);
         var content = `**${deviceButtonList.length} No Proto Devices:**\n${userTags.join(' ')}`;
         for (var m = 0; m < messagesNeeded; m++) {
            let buttonsNeeded = Math.min(25, deviceButtonList.length);
            let rowsNeeded = Math.ceil(buttonsNeeded / 5);
            var buttonCount = 0;
            var messageComponents = [];
            for (var n = 0; n < rowsNeeded && n < 5; n++) {
               var buttonRow = new ActionRowBuilder();
               for (var r = 0; r < 5; r++) {
                  if (buttonCount < buttonsNeeded) {
                     buttonRow.addComponents(deviceButtonList[buttonCount]);
                     buttonCount++;
                  }
               } //End of r loop
               messageComponents.push(buttonRow);
            } //End of n loop
            noProtoChannel.send({
                  content: content,
                  components: messageComponents
               }).catch(console.error)
               .then(msg => {
                  if (config.devices.statusButtonsDeleteMinutes > 0) {
                     setTimeout(() => msg.delete().catch(err => console.log(`Error deleting device status message:`, err)), (config.devices.statusButtonsDeleteMinutes * 1000 * 60));
                  }
               });
            content = '‎';
            let tempButtons = deviceButtonList.slice(25);
            deviceButtonList = tempButtons;
         } //End of m loop
      } //End of sendNoProtoButtons()
   }, //End of noProtoDevices()
}