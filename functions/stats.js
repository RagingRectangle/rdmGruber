var {
   ActionRowBuilder,
   EmbedBuilder,
   StringSelectMenuBuilder
} = require('discord.js');
var fs = require('fs');
var moment = require('moment');
var mysql = require('mysql2');
var QuickChart = require('quickchart-js');
var convert = require('color-convert');
var config = require('../config/config.json');
var util = require('../util.json');

module.exports = {
   statsMain: async function statsMain(client, channel, interaction, statType, statDuration, area) {
      await interaction.deferReply();
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
      //15 min values
      else if (statDuration == '15_min') {
         rpl = 15;
         rplType = '15 Min';
         rplLength = config.rdmStats.dataPointCount['15min'];
         rplStamp = rplStamp.replace(' HH:mm', '');
      }
      let opacity = config.rdmStats.colorPalette.opacity ? config.rdmStats.colorPalette.opacity : 0.2;
      let options = {
         rpl: rpl,
         rplType: rplType,
         rplLength: rplLength,
         rplStamp: rplStamp,
         color1: config.rdmStats.colorPalette.color1.toLowerCase(),
         background1: `rgba(${convert.keyword.rgb(config.rdmStats.colorPalette.color1.toLowerCase()).join(', ')}, ${opacity})`,
         color2: config.rdmStats.colorPalette.color2.toLowerCase(),
         background2: `rgba(${convert.keyword.rgb(config.rdmStats.colorPalette.color2.toLowerCase()).join(', ')}, ${opacity})`,
         color3: config.rdmStats.colorPalette.color3.toLowerCase(),
         background3: `rgba(${convert.keyword.rgb(config.rdmStats.colorPalette.color3.toLowerCase()).join(', ')}, ${opacity})`
      }
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


   statsWorkerMain: async function statsWorkerMain(client, interaction, statDuration, workerName) {
      console.log(`${interaction.user.username} looked up worker stats: ${workerName} ${statDuration}`);
      let statConfig = require('../stats.json');
      if (!statConfig.workers.includes(workerName)) {
         console.log(`Failed to find rdmStats worker: ${workerName}`);
         return;
      }
      let defaultStatType = 'workerMonsScanned';
      await interaction.deferReply();
      await interaction.channel.send(`Creating worker stats...`).catch(console.error)
         .then(msg => {
            this.UpdateWorkerStats(client, msg, workerName, statDuration, defaultStatType);
         });
      await interaction.deleteReply();
   }, //End of statsWorkerMain()


   UpdateWorkerStats: async function UpdateWorkerStats(client, message, workerName, statDuration, type) {
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
      //15 min
      if (statDuration == '15min') {
         rpl = 15;
         rplType = '15 Min';
         rplLength = config.rdmStats.dataPointCount['15min'] ? config.rdmStats.dataPointCount['15min'] : 48;
         var rplStamp = config.raidBoardOptions.useDayMonthYear == false ? 'MM-DD HH:mm' : 'DD-MM HH:mm';
      }
      let opacity = config.rdmStats.colorPalette.opacity ? config.rdmStats.colorPalette.opacity : 0.2;
      let options = {
         rpl: rpl,
         rplType: rplType,
         rplLength: rplLength,
         rplStamp: rplStamp,
         color1: config.rdmStats.colorPalette.color1.toLowerCase(),
         background1: `rgba(${convert.keyword.rgb(config.rdmStats.colorPalette.color1.toLowerCase()).join(', ')}, ${opacity})`,
         color2: config.rdmStats.colorPalette.color2.toLowerCase(),
         background2: `rgba(${convert.keyword.rgb(config.rdmStats.colorPalette.color2.toLowerCase()).join(', ')}, ${opacity})`,
         color3: config.rdmStats.colorPalette.color3.toLowerCase(),
         background3: `rgba(${convert.keyword.rgb(config.rdmStats.colorPalette.color3.toLowerCase()).join(', ')}, ${opacity})`
      }
      if (type == 'workerMonsScanned') {
         let graphURL = await this.getWorkerMonsScanned(workerName, options);
         let graphTitle = `${workerName} Mons Scanned (${options.rplType})`;
         updateWorkerGraph(graphURL, graphTitle);
      } else if (type == 'workerHandlingTime') {
         let graphURL = await this.getWorkerHandlingTime(workerName, options);
         let graphTitle = `${workerName} Handling Time (${options.rplType})`;
         updateWorkerGraph(graphURL, graphTitle);
      } else if (type == 'workerLocations') {
         let graphURL = await this.getWorkerLocations(workerName, options);
         let graphTitle = `${workerName} Locations Handled (${options.rplType})`;
         updateWorkerGraph(graphURL, graphTitle);
      } else if (type == 'workerSuccessRate') {
         let graphURL = await this.getWorkerSuccessRate(workerName, options);
         let graphTitle = `${workerName} Success Rate (${options.rplType})`;
         updateWorkerGraph(graphURL, graphTitle);
      } else if (type == 'workerLostScanning') {
         let graphURL = await this.getWorkerLostScanning(workerName, options);
         let graphTitle = `${workerName} Lost Scanning Time (${options.rplType})`;
         updateWorkerGraph(graphURL, graphTitle);
      }

      async function updateWorkerGraph(url, title) {
         var componentList = [];
         var listOptions = [];
         for (var i in util.stats.workerStats) {
            if (util.stats.workerStats[i]['value'] != type) {
               listOptions.push(util.stats.workerStats[i]);
            }
         } //End of i loop
         componentList.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`${config.serverName}~stats~worker~${workerName}~${statDuration}`).setPlaceholder('Worker Stat Type').addOptions(listOptions)));
         await message.edit({
               content: ``,
               embeds: [new EmbedBuilder().setTitle(title).setImage(url)],
               components: componentList
            }).catch(console.error)
            .then(async msg => {
               if (config.rdmStats.graphDeleteSeconds > 0) {
                  setTimeout(() => msg.delete().catch(err => console.log(`(${interaction.user.username}) Error deleting rdmStats graph:`, err)), (config.rdmStats.graphDeleteSeconds * 1000));
               }
            });
      } //End of updateWorkerGraph()
   }, //UpdateWorkerStats()


   getWorkerMonsScanned: async function getWorkerMonsScanned(workerName, options) {
      let workerResultsTemp = await this.runStatQuery(util.queries.stats.workerMonsScanned.replace("{{worker}}", workerName).replace("{{rpl}}", options.rpl).replace("{{rplLength}}", options.rplLength));
      let workerResults = workerResultsTemp[0].reverse();
      var labels = [];
      var monsSeen = [];
      var monsEncountered = [];
      var iv = [];
      workerResults.forEach(entry => {
         labels.push(moment(entry.time).format(options.rplStamp));
         monsSeen.push(entry.monsSeen);
         monsEncountered.push(entry.encountered);
         iv.push(entry.iv);
      });
      let myChart = new QuickChart();
      myChart.setConfig({
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
                  label: `Mons Seen`,
                  data: monsSeen,
                  fill: true,
                  borderColor: options.color1,
                  backgroundColor: options.background1,
                  pointRadius: 0,
                  yAxisID: 'left_mons'
               },
               {
                  label: `Encountered`,
                  data: monsEncountered,
                  fill: true,
                  borderColor: options.color2,
                  backgroundColor: options.background2,
                  pointRadius: 0,
                  yAxisID: 'left_mons'
               },
               {
                  label: `% IV`,
                  data: iv,
                  fill: true,
                  borderColor: options.color3,
                  backgroundColor: options.background3,
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
      let url = await myChart.getShortUrl();
      return url;
   }, //End of getWorkerMonsScanned()


   getWorkerHandlingTime: async function getWorkerHandlingTime(workerName, options) {
      let workerResultsTemp = await this.runStatQuery(util.queries.stats.workerHandlingTime.replace("{{worker}}", workerName).replace("{{rpl}}", options.rpl).replace("{{rplLength}}", options.rplLength));
      let workerResults = workerResultsTemp[0].reverse();
      var labels = [];
      var handlingTime = [];
      workerResults.forEach(entry => {
         labels.push(moment(entry.time).format(options.rplStamp));
         handlingTime.push(entry.handlingTime);
      });
      let myChart = new QuickChart();
      myChart.setConfig({
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
               label: `Handling Time (s)`,
               data: handlingTime,
               fill: true,
               borderColor: options.color1,
               backgroundColor: options.background1,
               pointRadius: 0,
               yAxisID: 'left'
            }]
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
                     suggestedMax: 5,
                     fontColor: options.color1,
                     callback: (val) => {
                        return val.toLocaleString();
                     }
                  }
               }],
            }
         }
      });
      let url = await myChart.getShortUrl();
      return url;
   }, //End of getWorkerHandlingTime()


   getWorkerLocations: async function getWorkerLocations(workerName, options) {
      let workerResultsTemp = await this.runStatQuery(util.queries.stats.workerLocations.replace("{{worker}}", workerName).replace("{{rpl}}", options.rpl).replace("{{rplLength}}", options.rplLength));
      let workerResults = workerResultsTemp[0].reverse();
      var labels = [];
      var locations = [];
      workerResults.forEach(entry => {
         labels.push(moment(entry.time).format(options.rplStamp));
         locations.push(entry.locations);
      });
      let myChart = new QuickChart();
      myChart.setConfig({
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
               label: `Locations Handled`,
               data: locations,
               fill: true,
               borderColor: options.color1,
               backgroundColor: options.background1,
               pointRadius: 0,
               yAxisID: 'left'
            }]
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
               }],
            }
         }
      });
      let url = await myChart.getShortUrl();
      return url;
   }, //End of getWorkerLocations()


   getWorkerSuccessRate: async function getWorkerSuccessRate(workerName, options) {
      let workerResultsTemp = await this.runStatQuery(util.queries.stats.workerSuccessRate.replace("{{worker}}", workerName).replace("{{rpl}}", options.rpl).replace("{{rplLength}}", options.rplLength));
      let workerResults = workerResultsTemp[0].reverse();
      var labels = [];
      var successRate = [];
      workerResults.forEach(entry => {
         labels.push(moment(entry.time).format(options.rplStamp));
         successRate.push(entry.successRate);
      });
      let myChart = new QuickChart();
      myChart.setConfig({
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
               label: `Success Rate`,
               data: successRate,
               fill: true,
               borderColor: options.color1,
               backgroundColor: options.background1,
               pointRadius: 0,
               yAxisID: 'left'
            }]
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
                     suggestedMin: 99,
                     suggestedMax: 100,
                     fontColor: options.color1,
                     callback: (val) => {
                        return val + ' %'
                     }
                  }
               }],
            }
         }
      });
      let url = await myChart.getShortUrl();
      return url;
   }, //End of getWorkerSuccessRate()


   getWorkerLostScanning: async function getWorkerLostScanning(workerName, options) {
      let workerResultsTemp = await this.runStatQuery(util.queries.stats.workerLostScanning.replace("{{worker}}", workerName).replace("{{rpl}}", options.rpl).replace("{{rplLength}}", options.rplLength));
      let workerResults = workerResultsTemp[0].reverse();
      var labels = [];
      var lostScanning = [];
      workerResults.forEach(entry => {
         labels.push(moment(entry.time).format(options.rplStamp));
         lostScanning.push(entry.lostScanning);
      });
      let myChart = new QuickChart();
      myChart.setConfig({
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
               label: `Lost Time (s)`,
               data: lostScanning,
               fill: true,
               borderColor: options.color1,
               backgroundColor: options.background1,
               pointRadius: 0,
               yAxisID: 'left'
            }]
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
               }],
            }
         }
      });
      let url = await myChart.getShortUrl();
      return url;
   }, //End of getWorkerLostScanning()


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
               setTimeout(() => msg.delete().catch(err => console.log(`(${interaction.user.username}) Error deleting rdmStats graph:`, err)), (config.rdmStats.graphDeleteSeconds * 1000));
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


   getRdmStatsData: async function getRdmStatsData(client) {
      var statsInfo = require('../stats.json');
      var areaList = ["All Areas"];
      var workerList = [];
      let statsResult = await this.runStatQuery(`${util.queries.stats.getAreas} ${config.golbat == true ? util.queries.stats.getWorkers : ''}`);
      if (statsResult == 'ERROR') {
         console.log(`Error getting rdmStat data`);
         return;
      }
      //Add areas
      for (var r in statsResult[0]) {
         areaList.push(statsResult[0][r]['area']);
      } //End of r loop
      statsInfo.areas = areaList;
      //Add workers
      if (config.golbat == true) {
         for (var w in statsResult[1]) {
            workerList.push(statsResult[1][w]['worker']);
         } //End of w loop
         statsInfo.workers = workerList;
      }
      fs.writeFileSync('./stats.json', JSON.stringify(statsInfo));
   } //End of getRdmStatsData()
}