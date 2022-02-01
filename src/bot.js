require('dotenv').config();

const { Client, Intents, ClientVoiceManager } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const PREFIX = "$"

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`)
});

client.on('message', (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(PREFIX)){
        const [CMD_NAME, ...args] = message.content
        .trim()
        .substring(PREFIX.length)
        .split(/\s+/);
        console.log(CMD_NAME);
        console.log(args);
        if (CMD_NAME === 'kick'){
            if (!message.member.permissions.has("KICK_MEMBERS")) 
                return message.reply("No permission to kick")
            if(args.length === 0 ) return message.reply('Please provide an ID');
            const member = message.guild.members.cache.get(args[0])
            console.log(member);
            if(member){
                member
                .kick()
                .then(member => message.channel.send(`${member} was kicked.`))
                .catch(err => "I do not have the permissions :(");
            } else {
                message.reply('That member was not found');
            }
        }
    }
});
client.login(process.env.DISCORDJS_BOT_TOKEN);