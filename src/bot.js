require('dotenv').config();
wordList = require('../wordlist.json')
birdleList = wordList.filter(word => word.length > 5);

const fs = require('fs'); // we need to require fs to packaged with node




const { MessageEmbed } = require('discord.js');
const { Client, Intents } = require('discord.js');
const { sensitiveHeaders } = require('http2');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const PREFIX = "$"

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`)
});

client.on('messageCreate', (message) => {
    var userData = JSON.parse(fs.readFileSync('./src/storage/userData.json', 'utf8'));
    if (message.author.bot) return;
    if (message.content.startsWith(PREFIX)){
        const [CMD_NAME, ...args] = message.content
        .trim()
        .substring(PREFIX.length)
        .split(/\s+/);
        if (CMD_NAME === 'play'){


            let answer = birdleList[Math.floor(Math.random() * 472)];
            let hints = [];
            hints.length = answer.length
            hints.fill(":black_large_square:")
            console.log(answer);

            let randomNumberList = []
            randomNumberList.length = Math.floor(answer.length / 2)
            
            
            for(let i = 0; i < randomNumberList.length; i++){
                randomNumberList[i] = Math.floor(Math.random() * randomNumberList.length);
            }
            
            //converting letter placements into actual letters
            randomNumberList.forEach( element => {
                hints[randomNumberList[element]] = `:regional_indicator_${answer[randomNumberList[element]]}:` 
            })

            let hintsValue = 0
            hints.forEach(elements => {
                if (elements === ":black_large_square:"){
                    hintsValue += 1;
                }
            })
            pointsWorth = answer.length * hintsValue;

            let filter = msg => {
                return msg.content === answer && !message.author.bot
            }
            let collector = message.channel.createMessageCollector({filter, time: 10000, max: 1})

            collector.on('collect', (msg) => {

                const exampleEmbed = new MessageEmbed()
                    .setColor('#00ff33')
                    .setTitle(`Congratulations, ${msg.author.username}!`)
                    .setDescription(`The answer was ${answer.toUpperCase()}.`)
                    .addFields(
                        { name: 'Points earned', value: `${pointsWorth}` },
                    )
                msg.channel.send({ embeds: [exampleEmbed] });
                if(!userData[msg.author.id]) userData[message.author.id] = {
                    points : 0
                }
                userData[msg.author.id].points += answer.length;
                console.log(msg.author.id)
                // To input point values to the winners of the word game
                 fs.writeFile('./src/storage/userData.json', JSON.stringify(userData), (err) => {
                    if (err) console.error(err)
                });
            })

            collector.on('end', (collected, reason) => {
                if(reason === 'time'){
                    const exampleEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle(`Ran out of time!`)
                    .setDescription(`The answer was ||${answer.toUpperCase()}||`)
                message.channel.send({ embeds: [exampleEmbed] });
                } 
            })

            //display the hint letters and amount of missing characters
            const exampleEmbed = new MessageEmbed()
                    .setColor('#848484')
                    .setTitle(`The word is worth **${pointsWorth}**`)
                    .setDescription(`${hints.join(" ")}`)
                message.channel.send({ embeds: [exampleEmbed] });
        }

        if (CMD_NAME === "points") {
            message.channel.send(`You currently have **${userData[message.author.id].points}** points.`)
        }

        
    }
});
client.login(process.env.DISCORDJS_BOT_TOKEN);
