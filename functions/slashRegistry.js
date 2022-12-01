var {
   Collection
} = require('discord.js');
var fs = require('fs');
var config = require('../config/config.json');

module.exports = {
   registerCommands: async function registerCommands(client) {
      var commands = [];
      var commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
      var finalCommands = [];
      var {
         REST
      } = require('@discordjs/rest');
      var {
         Routes
      } = require('discord-api-types/v10');
      for (const file of commandFiles) {
         if (config.discord[file.replace('.js', '')]) {
            const command = require(`../commands/${file}`);
            try {
               commands.push(command.data.toJSON());
               finalCommands.push(file);
            } catch (err) {
               console.log(err);
            }
         }
      }
      for (const guildID of config.discord.slashGuildIDs) {
         const rest = new REST({
            version: '10'
         }).setToken(config.discord.token);
         rest.put(Routes.applicationGuildCommands(client.user.id, guildID), {
               body: commands
            })
            .then(() => console.log(`Registered slash commands for guild: ${guildID}`))
            .catch(console.error);

         client.commands = new Collection();
         for (const file of finalCommands) {
            const command = require(`../commands/${file}`);
            client.commands.set(command.data.name, command);
         }
      } //End of guildID
   } //End of registerCommands()
}