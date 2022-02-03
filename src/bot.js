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

client.on('messageCreate', async message => {

    function getUserFromMention(mention) {
        if (!mention) return;
    
        if (mention.startsWith('<@') && mention.endsWith('>')) {
            mention = mention.slice(2, -1);
    
            if (mention.startsWith('!')) {
                mention = mention.slice(1);
            }
    
            return client.users.cache.get(mention);
        }
    }

    var userData = JSON.parse(fs.readFileSync('./src/storage/userData.json', 'utf8'));
    if (message.author.bot) return;
    if (message.content.startsWith(PREFIX)){
        let [CMD_NAME, ...args] = message.content
        .trim()
        .substring(PREFIX.length)
        .split(/\s+/);

        CMD_NAME = CMD_NAME.toLowerCase();
        if (CMD_NAME === 'play'){

            let answer = birdleList[Math.floor(Math.random() * 1131)];
            let visibleLettersList = [];
            visibleLettersList.length = answer.length
            visibleLettersList.fill(":black_large_square:")

            let randomNumberList = []
            randomNumberList.length = Math.floor(answer.length / 2)
            
            
            for(let i = 0; i < randomNumberList.length; i++){
                let ranNum = 0;
                do {
                    ranNum = Math.floor(Math.random() * visibleLettersList.length);
                } while(randomNumberList.includes(ranNum))
                randomNumberList[i] = ranNum;
            }
            //converting letter placements into actual letters
            for(let i = 0; i < randomNumberList.length; i++){
                visibleLettersList[randomNumberList[i]] = `:regional_indicator_${answer[randomNumberList[i]]}:`
            }
            console.log(answer)

            let visibleLettersListValue = 0
            visibleLettersList.forEach(elements => {
                if (elements === ":black_large_square:"){
                    visibleLettersListValue += 1;
                }
            })
            pointsWorth = answer.length * visibleLettersListValue;


            //GUESS
            const filter = msg => {
                return msg.content === answer && !msg.author.bot
            }
            const collector = message.channel.createMessageCollector({filter, time: 30000, max: 1})

            collector.on('collect', (msg) => {
                const exampleEmbed = new MessageEmbed()
                    .setColor('#00ff33')
                    .setTitle(`Congratulations, ${msg.author.username}!`)
                    .setDescription(`The answer was ${answer.toUpperCase()}.`)
                    .addFields(
                        { name: 'Points earned', value: `${pointsWorth}` },
                    )
                msg.channel.send({ embeds: [exampleEmbed] });
                if(!userData[msg.author.id]) userData[msg.author.id] = {
                    points : 0
                }
                userData[msg.author.id].points += pointsWorth;
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

            //HINT
            const filter1 = msg => {
                return msg.content === '$hint' && !msg.author.bot
            }
            const collector1 = message.channel.createMessageCollector({filter:filter1, time: 30000, max: 3})

            collector1.on('collect', (msg) => {
                console.log(`hinting: ${msg.content}`)
                if(!userData[msg.author.id]) userData[msg.author.id] = {
                    points : 0
                }
                if(userData[msg.author.id].points >= 10){
                    for(let i = 0; i < answer.length; i++){
                        if(!randomNumberList.includes(i)){
                            const exampleEmbed = new MessageEmbed()
                                .setColor('#ffff00')
                                .setTitle(`Hint`)
                                .setDescription(`Letter ${i + 1} is **${answer[i].toUpperCase()}**`)
                                .addFields(
                                    { name: 'Points lost', value: `10` },
                                )
                            msg.reply({ embeds: [exampleEmbed] });
                            userData[msg.author.id].points -= 10;
                            fs.writeFile('./src/storage/userData.json', JSON.stringify(userData), (err) => {
                                if (err) console.error(err)
                            });
                            
                            break;
                        } 
                    }
                 }   else {
                    const exampleEmbed = new MessageEmbed()
                        .setColor('#ffff00')
                        .setTitle(`Hint`)
                        .setDescription(`Insufficient amount of points to show hints`)
                    msg.reply({ embeds: [exampleEmbed] });
                }
            })

            collector1.on('end', (collected, reason) => {

            })  

            //display the visible letters and amount of missing characters
            const exampleEmbed = new MessageEmbed()
                    .setColor('#848484')
                    .setTitle(`The word is worth **${pointsWorth}** points`)
                    .setDescription(`${visibleLettersList.join(" ")}`)
                    .addFields(
                        { name: 'Letters', value: `${answer.length}` },
                    )
                message.channel.send({ embeds: [exampleEmbed] });
        }

        if (CMD_NAME === "points") {
            if(args[0] !== undefined) {
                let user = getUserFromMention(args[0]);
                message.reply(`${user.username} currently has **${userData[args[0].slice(3,-1)].points}** points`)
            } else {
            message.reply(`You currently have **${userData[message.author.id].points}** points.`)
            }
        }
        
        if(CMD_NAME === "help"){
            const exampleEmbed = new MessageEmbed()
                    .setColor('#000000')
                    .setTitle(`**Commands**`)
                    .addFields(
                        { name: 'play', value: `play da game` },
                        { name: 'points', value: `see how much you're worth`},
                        { name: 'hint', value: `no hints you fking retard`},
                        { name: 'shae', value: `find your yourself shaymin`},
                    )
            message.channel.send({ embeds: [exampleEmbed] });
        }
        if(CMD_NAME === "shae"){
            message.channel.send("<@647250920069005322> https://cdn.discordapp.com/emojis/883589510796025939.webp?size=96&quality=lossless")
        }
        
    }
});


client.login(process.env.DISCORDJS_BOT_TOKEN);
