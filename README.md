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
- Reaction role manager
- See current status of RDM devices
- Click device buttons to get basic info
- See devices that haven't been seen recently
- Automate no proto checks and post in Discord
- Optional slash commands available
- Options to verify certain actions first
- Limit commands to only certain roles

  
  
   
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
- **noProtoIgnoreDevices:** Array of devices to be ignored during noProto checks.
- **checkDeleteMinutes:** How long to wait until auto check messages are deleted (Set to 0 to never delete).
- **infoMessageDeleteSeconds:** How long to wait until device info responses are deleted (Set to 0 to never delete).
- **statusButtonsDeleteMinutes:** How long to wait until messages with device buttons are deleted (Set to 0 to never delete).
- **buttonLabelRemove:** List of strings to ignore when posting device buttons. Button rows can look [crappy](https://cdn.discordapp.com/attachments/927646498152398849/1019506615814209576/unknown.png?size=4096) on mobile so this can help.
- **displayOptions:** Customize what info is displayed for devices (true/false).

rdmDB:
- Enter your basic RDM database info. Make sure your user has access if the database is not local.

 
  

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

  
  

## Examples
###### PM2 Controller:
![PM2](https://media.giphy.com/media/NXURwVTS9bdRXHMt49/giphy.gif)
###### Run Custom Scripts:
![Scripts](https://media.giphy.com/media/KVzaguhH4o99CLZs09/giphy.gif)
###### Quick Links:
![Links](https://media.giphy.com/media/Mz1mf6OJyL727WnkGe/giphy.gif)