const fs = require('fs');
const pm2 = require('pm2');
const mysql = require('mysql2');
const config = require('../config/config.json');

module.exports = {
   generate: async function generate() {
      var serverInfo = {};
      //PM2 Processes
      let processList = generatePM2();

      function generatePM2() {
         try {
            var pm2List = [];
            pm2.connect(function (err) {
               if (err) {
                  console.error(err);
               } else {
                  pm2.list((err, response) => {
                     if (err) {
                        console.error(err);
                     } else {
                        response.forEach(process => {
                           if (!config.pm2.ignore.includes(process['name'])) {
                              pm2List.push(process['name']);
                           }
                        }); //End of forEach process
                     }
                  }); //End of pm2.list
               }
            }); //End of pm2.connect
         } catch (err) {}
         return pm2List
      } //End of generatePM2()
      pm2.disconnect();
      serverInfo.processList = processList;

      //Instance Types
      var instanceList = {};
      var db = config.rdmDB;
      db.multipleStatements = true;
      let connection = mysql.createConnection(db);
      let instanceQuery = `SELECT DISTINCT(type) FROM instance; SELECT a.uuid 'uuid', a.instance_name 'instance', a.last_host 'ip', a.last_seen 'last_seen', a.account_username 'username', a.last_lat 'lat', a.last_lon 'lon', b.type 'type' FROM device a, instance b WHERE a.instance_name = b.name;`;
      connection.query(instanceQuery, function (err, results) {
         if (err) {
            console.log("Generate server info error:", err);
         } else {
            let typeNames = results[0];
            let instanceNames = results[1];
            for (var t in typeNames) {
               let type = typeNames[t]['type'];
               let typeInstances = [];
               for (var i in instanceNames) {
                  if (instanceNames[i]['type'] === type) {
                     typeInstances.push(instanceNames[i]['instance']);
                  }
               } //End of i loop
               instanceList[type] = [...new Set(typeInstances)];
            } //End of types
         }
      }); //End of query()
      connection.end();
      serverInfo.instanceList = instanceList;
      await new Promise(done => setTimeout(done, 3000));

      fs.writeFileSync('./Server_Info.json', JSON.stringify(serverInfo));
   } //End of generate()
}