const {
	EmbedBuilder,
	SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const Roles = require('../functions/roles.js');
const mysql = require('mysql2');
const config = require('../config/config.json');
const util = require('../util.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(config.discord.raidCommand.toLowerCase().replaceAll(/[^a-z0-9]/gi, '_'))
		.setDescription(`Create Raid Board`),

	async execute(client, interaction) {
		let channel = await client.channels.fetch(interaction.channelId).catch(console.error);
		let guild = await client.guilds.fetch(interaction.guildId).catch(console.error);
		let userPerms = await Roles.getUserCommandPerms(guild, interaction.user);
		if (!userPerms.includes('admin')) {
			return
		}

		var db = config.rdmDB;
		db.multipleStatements = true;

		runQuery = (query) => {
         let connection = mysql.createConnection(db);
         return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => {
               if (error) {
                  connection.end();
                  return reject(error);
               }
               connection.end();
					fs.writeFileSync('./test.json',JSON.stringify(results))
					for (var r in results){
						console.log(results[r].length)
					}



               return resolve(results);
            });
         });
      };
		
		await runQuery(util.queries.all_raids);




		return;
	}, //End of execute()
};