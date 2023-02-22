# rdmGruber Bot

## About
A Discord bot used as a very basic GUI for your server along with some RDM-specific features.

Join the Discord server for any help and to keep up with updates: https://discord.gg/USxvyB9QTz


**Current Features:**
- PM2 controller (start/stop/restart + current status)
- Run custom scripts with optional variables
- Custom SQL queries for RDM database
- Quickly access URL bookmarks
- Grep files for search strings
- Boards for current and history stats
- Raid boards
- Quest boards
- Custom emojis/translations
- Reaction role manager
- See current status of RDM devices
- Click device buttons to get basic info
- See devices that haven't been seen recently
- Automate no proto checks and post in Discord
- Optional slash commands available
- Options to verify certain actions first
- Limit commands to only certain roles
- [dkmur's rdmStats](https://github.com/dkmur/rdmStats) integration
- [naji's leaderboard](https://github.com/na-ji/leaderboard) integration

  
  
   
## Requirements
1: Node 16+ installed on server

2: Discord bot with:
  - Server Members Intent
  - Message Content Intent
  - Read/write perms in channels
  - Manage Roles perm (if using role feature)

 
  
  
## Install
```
git clone https://github.com/RagingRectangle/rdmGruber.git
cd rdmGruber
cp -r config.example config
npm install
```
 
  

## Config Setup
- **serverName:** Custom name for your server.
- **timezoneOffsetHours:** For if your RDM server uses a different timezone than the DB server.

Discord:
- **token:** Discord bot token.
- **prefix:** Used in front of Discord commands.
- **adminIDs:** List of Discord user IDs that can execute all commands.
- **channelIDs:** List of channel IDs that the bot will respond in. Does not work with DMs.
- **useSlashCommands:** Whether or not to register slash commands in guilds (true/false).
    - [Bot must have applications.commands scope](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#creating-and-using-your-invite-link)
- **slashGuildIDs:** List of guild IDs where commands should be registered.
- **helpCommand:** Show correct syntax and what perms user has.
- **pm2Command:** Show PM2 controller.
- **scriptCommand:** Show list of scripts.
- **queryCommand:** Show custom query list.
- **linksCommand:** Show list of bookmarks.
- **devicesCommand:** Get status of all devices.
- **noProtoCommand:** Get noProto devices.
- **grepCommand:** Search uploaded file for string and return the lines where it's included (Slash command only).
- **boardCommand:** Create current and historical stat boards (Slash command only).
- **questCommand:** Get list of Pokestop with quest reward in an area (Slash command only).
- **statsCommand:** Create graphs from rdmStats (Slash command only).
- **leadersCommand:** Create leaderboards for top users (Slash command only).

PM2:
- **ignore:** List of PM2 processes/modules to ignore if you don't want buttons for them.
- **pm2ResponseDeleteSeconds:** How long to wait until pm2 response is deleted (Set to 0 to never delete).

Roles:
- **sendRoleMessage:** Whether or not to send role added/removed messages (true/false).
- **roleMessageDeleteSeconds:** How long to wait until role message is deleted (Set to 0 to never delete).
- **commandPermRoles:** List of command types and the role IDs that are allowed to use them.

Scripts:
- **scriptVerify:** Whether or not to verify running script (true/false).
- **scriptResponseDeleteSeconds:** How long to wait until script response is deleted (Set to 0 to never delete).

Devices:
- **noProtoMinutes:** Limit for how long it's been since the device has been heard from.
- **noProtoCheckMinutes:** Automate checks for unseen devices (Set to 0 to disable auto-check).
- **noProtoChannelID:** Channel ID where automated warnings should be posted.
- **noProtoAlertUsers:** List of user IDs that will be tagged during automated checks.
- **noProtoIgnoreDevices:** Array of devices to be ignored during noProto checks.
- **noProtoIgnoreQuestDevices:** Whether or not to ignore devices that are questing (true/false).
- **checkDeleteMinutes:** How long to wait until auto check messages are deleted (Set to 0 to never delete).
- **infoMessageDeleteSeconds:** How long to wait until device info responses are deleted (Set to 0 to never delete).
- **statusButtonsDeleteMinutes:** How long to wait until messages with device buttons are deleted (Set to 0 to never delete).
- **buttonLabelRemove:** List of strings to ignore when posting device buttons. Button rows can look [crappy](https://cdn.discordapp.com/attachments/927646498152398849/1019506615814209576/unknown.png?size=4096) on mobile so this can help.
- **displayOptions:** Customize what info is displayed for devices (true/false).

rdmDB:
- Enter your basic RDM database info. Make sure your user has access if the database is not local.

golbatDB:
- If you use Golbat you will also need to fill in this section. Currently only used for Leaderboards.

RaidBoardOptions:
- **mapLink:** Turn gym names into map hyperlinks (true/false).
- **linkFormat:** Use custom links to point towards your own map. (Also for quests)
- **gymTeamEmoji:** Include emoji for controlling team (true/false).
- **use24Hour:** Use 24 hour format in footer (true/false).
- **useDayMonthYear:** Use Day/Month/Year format in footer (true/false).  (Also for quests)
- **language:** Translate Pokemon and their moves (See options in */locale*).  (Also for quests)

questBoardOptions:
- **dmResponse:** Keep server channels clean by sending quest list directly to user.
- **iconRepo:** UICON repo for quest images.
- **questPercentage:** Include % of completed quests.
- **roleRestriction:** If set to false then users with roles listed in the quest commandPermRoles config can request quests for all areas in *config/geofence.json*. If set to true then areas will be limited to only users with specific roles. 
- **questRoles:** Limit areas according to roles. Role IDs with an array of usable geofence names.

rdmStats:
- [Install info](https://github.com/dkmur/rdmStats)
- **database:** Basic stats database info.
- **dataPointCount:** How many individual points on graphs for each type.
- **colorPalette:** Colors used for stat graphs. Accepts all common color names.
    - **opacity:** Graph infill amount between 0 and 1.
- **graphDeleteSeconds:** How long to wait until graphs are deleted (Set to 0 to never delete).

leaderboard:
- [Install info](https://github.com/na-ji/leaderboard)
- **database:** Basic leaderboard database info.
- **dailyUserLimit:** How many users to display in daily boards.
- **allTimeUserLimit:** How many users to display in all-time boards.
- **excludedUsers:** List of any users to exclude from boards.

 
  

## Scripts Setup
- Config file: */config/scripts.json*
- Absolute paths must be used in scripts to work. Look in the scripts.example.json to get an idea of how they can work.
- **customName:** Display name in list.
- **adminOnly:** Script level overrides to ignore users with script role (true/false).
- **description:** Short summary shown in list.
- **fullFilePath:** The absolute path to the file.
    - Ex: `/home/rdm/devicecontrol.sh`
    - Tip: If the same variables are always passed you can add them to the path.
    - Ex: `/home/rdm/devicecontrol.sh poe4 cycle 20`
- **variables:** Make sure each variable is in the correct order because that is how it will be sent with the script.
    - **varDescription:** Summary of this list of variables that will be shown. ("Pick which device" or "Choose the port").
    - **varOptions:** The list of options that this variable can be ("1", "2", "3", "4", "5").

 
  

## Custom Query Setup
- Config file: */config/queries.json*
- Some basic RDM queries already included.
- **name:** Query name to display in lists.
- **query:** The SQL query to run. Multiple statements allowed separated by `;` (Response will show query results in this order).


 
  
## Links Setup
- Config file: */config/links.json*
- Add up to 25 links as buttons.
- Emoji field is optional. 
    - Full emoji string `<:mad:475050731032936448>`
    - Unicode form (Get correct form by escaping default emojis: `\😺`).

 
  

## Reaction Role Setup
- Config file: */config/roles.json*
- **messageID:** The ID of the message with the emojis users can select to add/remove roles.
- **roleID:** The ID for the role that can be added/removed.
- **emojiName:** The unicode emoji or the custom emoji name (only the name, NOT full emoji string).

 
  
  
## Board Setup
- Send `/<boardCommand>`and follow the prompts for the board you'd like to create.
- To remove a board or edit the title you can do so in */config/geofence.json*.
- Delete boards by thier message ID with `/<boardCommand> delete`.
- To limit boards to specific areas use */config/geofence.json*.
- Can use either the geojson or geo.jasparke format (Only single polygons supported).


  
  
## Usage
- Start the bot in a console with `node rdmgruber.js`
- Can (*should*) use PM2 to run instead with `pm2 start rdmgruber.js`
- Bot will reply with the PM2 controller message when you send `<prefix><pm2Command>`
  - Press the Reload/Start/Stop buttons and then the processes you'd like to change.
  - Press the Status button to see the current status of processes.
- Get list of scripts with `<prefix><scriptCommand>`
- Get list of queries with `<prefix><madQueryCommand>`
- Get link buttons with `<prefix><linksCommand>`
- Get status of devices as buttons with `<prefix><devicesCommand>`
  - Press device button to get more info.
- Get info about specific device with `<prefix><device_name/origin>`
- See any naughty devices with `<prefix><noProtoCommand>`
- Search file for string and return matching lines with `/<grepCommand>` (slash only)
- Create current/history/raid boards with `/<boardCommand>` (slash only)
- Get list of specific quest rewards in an area with `/<questCommand>` (slash only)
- Get rdmStats graphs with `/<statsCommand>` (slash only)
  
  
  

## Examples
###### PM2 Controller:
![PM2](https://media.giphy.com/media/NXURwVTS9bdRXHMt49/giphy.gif)
###### Run Custom Scripts:
![Scripts](https://media.giphy.com/media/KVzaguhH4o99CLZs09/giphy.gif)
###### Quick Links:
![Links](https://media.giphy.com/media/Mz1mf6OJyL727WnkGe/giphy.gif)

###### dkmur rdmStats:
![Despawn Left](https://i.imgur.com/g2yBK0t.png)
![Mons Scanned](https://i.imgur.com/sJF2HV9.png)
![Stat Resets](https://i.imgur.com/pZ0roz1.png)
![Spawnpoints](https://i.imgur.com/Qk8OMni.png)

###### naji leaderboard:
![Despawn Left](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmRhM2MxY2YyMmMyYmI4YTUyMjcyNjVlNmQ4NWI5YTRhM2U5Njc3OSZjdD1n/WK0g50VhpMVRtnYGls/giphy.gif)