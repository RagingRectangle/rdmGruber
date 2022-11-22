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
const moment = require('moment');
const mysql = require('mysql2');
const QuickChart = require('quickchart-js');
const convert = require('color-convert');
const config = require('../config/config.json');
const util = require('../util.json');

module.exports = {
   statsMain: async function statsMain(client, channel, interaction, statType, statDuration, area) {
      let statConfig = require('../stats.json');
      console.log(`${interaction.user.username} looked up stats: ${area} ${statDuration} ${statType}`);
      let statAreas = area == 'All Areas' ? `'${statConfig.areas.join("', '")}'` : `'${area}'`;
      //Hourly values
      var rpl = 60;
      var rplType = 'Hourly';
      var rplLength = config.rdmStats.dataPointCount.hourly;
      var rplStamp = config.raidBoardOptions.useDayMonthYear == false ? 'MM-DD HH:mm' : 'DD-MM HH:mm';
      //Daily values
      if (statDuration == 'daily') {
         rpl = 1440;
         rplType = 'Daily';
         rplLength = config.rdmStats.dataPointCount.daily;
         rplStamp = rplStamp.replace(' HH:mm', '');
      }
      let options = {
         rpl: rpl,
         rplType: rplType,
         rplLength: rplLength,
         rplStamp: rplStamp,
         color1: config.rdmStats.colorPalette.color1.toLowerCase(),
         background1: `rgba(${convert.keyword.rgb(config.rdmStats.colorPalette.color1.toLowerCase()).join(', ')}, 0.5)`,
         color2: config.rdmStats.colorPalette.color2.toLowerCase(),
         background2: `rgba(${convert.keyword.rgb(config.rdmStats.colorPalette.color2.toLowerCase()).join(', ')}, 0.5)`,
         color3: config.rdmStats.colorPalette.color3.toLowerCase(),
         background3: `rgba(${convert.keyword.rgb(config.rdmStats.colorPalette.color3.toLowerCase()).join(', ')}, 0.5)`
      }
      //Mons Scanned
      if (statType == 'monsScanned') {
         this.monsScanned(client, interaction, statDuration, area, statAreas, options);
      } else if (statType == 'despawnLeft') {
         this.despawnLeft(client, interaction, statDuration, area, statAreas, options);
      } else if (statType == 'statResets') {
         this.statResets(client, interaction, statDuration, area, statAreas, options);
      } else if (statType == 'spawnpoints') {
         this.spawnpoints(client, interaction, statDuration, area, statAreas, options);
      }
   }, //End of statsMain()


   monsScanned: async function monsScanned(client, interaction, statDuration, footerText, statAreas, options) {
      let statConfig = require('../stats.json');
      let scannedResultsTemp = await this.runStatQuery(util.queries.stats.monsScanned.replace("{{rpl}}", options.rpl).replace("{{areas}}", statAreas).replace("{{rplLength}}", options.rplLength));
      let scannedResults = scannedResultsTemp[0].reverse();
      var labels = [];
      var mons = [];
      var iv = [];
      scannedResults.forEach(entry => {
         labels.push(moment(entry.time).format(options.rplStamp));
         mons.push(entry.mons);
         iv.push(entry.iv);
      });
      let myChart = new QuickChart();
      myChart.setConfig({
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
                  label: `Mons`,
                  data: mons,
                  fill: true,
                  borderColor: options.color1,
                  backgroundColor: options.background1,
                  pointRadius: 0,
                  yAxisID: 'left_mons'
               },
               {
                  label: `IV`,
                  data: iv,
                  fill: true,
                  borderColor: options.color2,
                  backgroundColor: options.background2,
                  pointRadius: 0,
                  yAxisID: 'right_iv'
               }
            ]
         },
         options: {
            "stacked": false,
            scales: {
               yAxes: [{
                     id: "left_mons",
                     type: "linear",
                     display: true,
                     position: "left",
                     ticks: {
                        suggestedMin: 0,
                        suggestedMax: 1,
                        fontColor: options.color1,
                        callback: (val) => {
                           return val.toLocaleString();
                        }
                     }
                  },
                  {
                     id: "right_iv",
                     type: "linear",
                     display: true,
                     position: "right",
                     ticks: {
                        suggestedMin: 99,
                        suggestedMax: 100,
                        fontColor: options.color2,
                        callback: (val) => {
                           return val + ' %'
                        }
                     }
                  }
               ],
            }
         }
      });
      let title = `Mons Scanned (${options.rplType})`;
      let url = await myChart.getShortUrl();
      this.sendChart(interaction, title, footerText, url);
   }, //End of monsScanned()


   despawnLeft: async function despawnLeft(client, interaction, statDuration, footerText, statAreas, options) {
      let despawnResultsTemp = await this.runStatQuery(util.queries.stats.despawnLeft.replace("{{rpl}}", options.rpl).replace("{{areas}}", statAreas).replace("{{rplLength}}", options.rplLength));
      let despawnResults = despawnResultsTemp[0].reverse();
      var labels = [];
      var wild = [];
      var encounter = [];
      despawnResults.forEach(entry => {
         labels.push(moment(entry.time).format(options.rplStamp));
         wild.push(entry.wild);
         encounter.push(entry.encounter);
      });
      let myChart = new QuickChart();
      myChart.setConfig({
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
                  label: `Verified Wild`,
                  data: wild,
                  fill: true,
                  borderColor: options.color1,
                  backgroundColor: options.background1,
                  pointRadius: 0,
                  yAxisID: 'left'
               },
               {
                  label: `Verified Encounter`,
                  data: encounter,
                  fill: true,
                  borderColor: options.color2,
                  backgroundColor: options.background2,
                  pointRadius: 0,
                  yAxisID: 'left'
               }
            ]
         },
         options: {
            "stacked": true,
            scales: {
               yAxes: [{
                  id: "left",
                  type: "linear",
                  display: true,
                  position: "left",
                  ticks: {
                     suggestedMin: 0,
                     suggestedMax: 30,
                     fontColor: options.color1,
                     callback: (val) => {
                        return val.toLocaleString();
                     }
                  }
               }],
            }
         }
      });
      let title = `Despawn Minutes Left (${options.rplType})`;
      let url = await myChart.getShortUrl();
      this.sendChart(interaction, title, footerText, url);
   }, //End of despawnLeft()


   statResets: async function statResets(client, interaction, statDuration, footerText, statAreas, options) {
      let statConfig = require('../stats.json');
      let resetResultsTemp = await this.runStatQuery(util.queries.stats.statResets.replace("{{rpl}}", options.rpl).replace("{{areas}}", statAreas).replace("{{rplLength}}", options.rplLength));
      let resetResults = resetResultsTemp[0].reverse();
      var labels = [];
      var resetMons = [];
      var reEncounter = [];
      var despawnLeft = [];
      resetResults.forEach(entry => {
         labels.push(moment(entry.time).format(options.rplStamp));
         resetMons.push(entry.resetMons);
         reEncounter.push(entry.reEncounter);
         despawnLeft.push(entry.despawnLeft);
      });
      let myChart = new QuickChart();
      myChart.setConfig({
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
                  label: `Reset Mons`,
                  data: resetMons,
                  fill: true,
                  borderColor: options.color1,
                  backgroundColor: options.background1,
                  pointRadius: 0,
                  yAxisID: 'left'
               },
               {
                  label: `Re-encountered`,
                  data: reEncounter,
                  fill: true,
                  borderColor: options.color2,
                  backgroundColor: options.background2,
                  pointRadius: 0,
                  yAxisID: 'left'
               },
               {
                  label: `Despawn Left`,
                  data: despawnLeft,
                  fill: true,
                  borderColor: options.color3,
                  backgroundColor: options.background3,
                  pointRadius: 0,
                  yAxisID: 'right'
               }
            ]
         },
         options: {
            "stacked": true,
            scales: {
               yAxes: [{
                     id: "left",
                     type: "linear",
                     display: true,
                     position: "left",
                     ticks: {
                        suggestedMin: 0,
                        suggestedMax: 1,
                        fontColor: options.color1,
                        callback: (val) => {
                           return val.toLocaleString();
                        }
                     }
                  },
                  {
                     id: "right",
                     type: "linear",
                     display: true,
                     position: "right",
                     ticks: {
                        suggestedMin: 0,
                        suggestedMax: 1,
                        fontColor: options.color3,
                        callback: (val) => {
                           return val.toLocaleString();
                        }
                     }
                  }
               ],
            }
         }
      });
      let title = `Stat Resets (${options.rplType})`;
      let url = await myChart.getShortUrl();
      this.sendChart(interaction, title, footerText, url);
   }, //End of statResets()


   spawnpoints: async function spawnpoints(client, interaction, statDuration, footerText, statAreas, options) {
      let statConfig = require('../stats.json');
      let spawnpointResultsTemp = await this.runStatQuery(util.queries.stats.spawnpoints.replace("{{rpl}}", options.rpl).replace("{{areas}}", statAreas).replace("{{rplLength}}", options.rplLength));
      let spawnpointResults = spawnpointResultsTemp[0].reverse();
      var labels = [];
      var spawnpoints = [];
      var verified = [];
      var seen = [];
      spawnpointResults.forEach(entry => {
         labels.push(moment(entry.time).format(options.rplStamp));
         spawnpoints.push(entry.spawnpoints);
         verified.push(entry.verified);
         seen.push(entry.seen);
      });
      let myChart = new QuickChart();
      myChart.setConfig({
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
                  label: `DB Spawnpoints`,
                  data: spawnpoints,
                  fill: true,
                  borderColor: options.color1,
                  backgroundColor: options.background1,
                  pointRadius: 0,
                  yAxisID: 'left'
               },
               {
                  label: `Spawnpoints Seen`,
                  data: seen,
                  fill: true,
                  borderColor: options.color2,
                  backgroundColor: options.background2,
                  pointRadius: 0,
                  yAxisID: 'left'
               },
               {
                  label: `% Verified`,
                  data: verified,
                  fill: true,
                  borderColor: options.color3,
                  backgroundColor: options.background3,
                  pointRadius: 0,
                  yAxisID: 'right'
               }
            ]
         },
         options: {
            "stacked": true,
            scales: {
               yAxes: [{
                     id: "left",
                     type: "linear",
                     display: true,
                     position: "left",
                     ticks: {
                        suggestedMin: 0,
                        suggestedMax: 1,
                        fontColor: options.color1,
                        callback: (val) => {
                           return val.toLocaleString();
                        }
                     }
                  },
                  {
                     id: "right",
                     type: "linear",
                     display: true,
                     position: "right",
                     ticks: {
                        suggestedMin: 99,
                        suggestedMax: 100,
                        fontColor: options.color3,
                        callback: (val) => {
                           return val + ' %'
                        }
                     }
                  }
               ],
            }
         }
      });
      let title = `Spawnpoints (${options.rplType})`;
      let url = await myChart.getShortUrl();
      this.sendChart(interaction, title, footerText, url);
   }, //End of spawnpoints()


   sendChart: async function sendChart(interaction, title, footerText, url) {
      await interaction.editReply({
            embeds: [new EmbedBuilder().setTitle(title).setImage(url).setFooter({
               text: footerText
            })],
         }).catch(console.error)
         .then(async msg => {
            if (config.rdmStats.graphDeleteSeconds > 0) {
               setTimeout(() => msg.delete().catch(err => console.log(`(${interaction.user.username}) Error deleting screenshot:`, err)), (config.rdmStats.graphDeleteSeconds * 1000));
            }
         });
   }, //End of sendChart()


   runStatQuery: async function runStatQuery(query) {
      try {
         var dbConfig = config.rdmStats.database;
         dbConfig.multipleStatements = true;
         let statsConnection = mysql.createConnection(dbConfig);
         return new Promise((resolve, reject) => {
            statsConnection.query(`${util.queries.dirtyRead} ${query}`, (error, results) => {
               if (error) {
                  statsConnection.end();
                  console.log(error)
                  return resolve(`ERROR`);
               }
               statsConnection.end();
               results.shift();
               return resolve(results);
            });
         });
      } catch (err) {
         console.log(err);
      }
   }, //End of runStatQuery()


   getStatAreas: async function getStatAreas(client) {
      var statsInfo = require('../stats.json');
      var areaList = ["All Areas"];
      let areaResult = await this.runStatQuery(util.queries.stats.getAreas);
      if (areaResult == 'ERROR') {
         console.log(`Error getting rdmStat areas`);
         return;
      }
      for (var r in areaResult[0]) {
         areaList.push(areaResult[0][r]['area']);
      } //End of r loop
      statsInfo.areas = areaList;
      fs.writeFileSync('./stats.json', JSON.stringify(statsInfo));
   } //End of getStatAreas()
}