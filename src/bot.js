require('dotenv').config();
wordList = require('../wordlist.json')
birdleList = wordList.filter(word => word.length > 5);

const fs = require('fs'); // we need to require fs to packaged with node




const { MessageEmbed, MessageAttachment } = require('discord.js');
const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js');
const { sensitiveHeaders } = require('http2');
const { waitForDebugger } = require('inspector');
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
            console.log(`The word is ${answer.toUpperCase()}`)

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
                console.log(`${msg.author.username} got the answer: ${answer.toUpperCase()}`)
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

            //WORD MESSAGE

            const hintButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('hint')
					.setLabel('Hint')
					.setStyle('PRIMARY'),
			);
            const wordEmbed = new MessageEmbed()
                    .setColor('#848484')
                    .setTitle(`The word is worth **${pointsWorth}** points`)
                    .setDescription(`${visibleLettersList.join(" ")}`)
                    .addFields(
                        { name: 'Letters', value: `${answer.length}` },
                    )
            await message.channel.send({embeds: [wordEmbed], components: [hintButton] });
            
            //HINT
            const filter1 = interaction => {
                return interaction.customId == 'hint' && !interaction.user.bot
            }
            const collector1 = message.channel.createMessageComponentCollector({filter:filter1, time: 30000, max: 1})
            collector1.on('collect', async interaction => {
                if(!userData[interaction.user.id]) userData[interaction.user.id] = {
                    points : 0
                }
                if(userData[interaction.user.id].points >= 10){
                    try {
                        for(let i = 0; i < answer.length; i++){
                            if(!randomNumberList.includes(i)){
                                    console.log(`>> ${interaction.user.username} used a hint to find Letter ${i + 1} is ${answer[i].toUpperCase()}`)
                                    await interaction.deferUpdate();
                                    await interaction.editReply({ content: `${interaction.user.username} used a hint!`, components: [] });
                                    const hintEmbed = new MessageEmbed()
                                        .setColor('#ffff00')
                                        .setTitle(`Hint`)
                                        .setDescription(`Letter ${i + 1} is **${answer[i].toUpperCase()}**`)
                                        .addFields(
                                            { name: 'Points lost', value: `10` },
                                        )
                                    await message.reply({ embeds: [hintEmbed], emphemeral: true });
                                    userData[interaction.user.id].points -= 10;
                                    fs.writeFile('./src/storage/userData.json', JSON.stringify(userData), (err) => {
                                        if (err) console.error(err)
                                    });
                                    break;
                                
                                }
                            } 
                    } catch (error) {
                        console.error(error)
                        await message.reply("Something went wrong. Please try to not use the hint button when multiple prompts are present. ||you fker stop trying to break my bot||");
                    }
                 }   else {
                    const hintFailedEmbed = new MessageEmbed()
                        .setColor('#ffff00')
                        .setTitle(`Hint`)
                        .setDescription(`Insufficient amount of points to show hints`)
                    message.reply({ embeds: [hintFailedEmbed], emphemeral: true });
                }
            })

            collector1.on('end', (collected, reason) => {

            })  

            
            
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
                        { name: 'shae', value: `find your yourself shaymin`},
                    )
            message.channel.send({ embeds: [exampleEmbed] });
        }
        if(CMD_NAME === "shae"){
            message.channel.send("<@647250920069005322> https://cdn.discordapp.com/emojis/883589510796025939.webp?size=96&quality=lossless")
        }

        if(CMD_NAME === "pet"){
                if(userData[message.author.id].points >= 1000){
                const exampleEmbed = new MessageEmbed()
                    .setColor('#793b3b')
                    .setTitle(`**You bought a goobie!**`)
                    .setFields(
                        {name: 'Points lost', value: '1000'}
                    )
                    .setThumbnail('https://cdn.drawception.com/images/panels/2017/10-19/T5gxcwASOP-6.png')
                message.channel.send({ embeds: [exampleEmbed] });
                userData[message.author.id].points -= 1000;
                fs.writeFile('./src/storage/userData.json', JSON.stringify(userData), (err) => {
                    if (err) console.error(err)
                });
            } else {
                const exampleEmbed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle('**Insufficient points**')
                    .setFields(
                        {name: 'Points needed', value: '1000'}
                    )
                    message.channel.send({ embeds: [exampleEmbed] });
            }
        }
        
    }
});


client.login(process.env.DISCORDJS_BOT_TOKEN);
