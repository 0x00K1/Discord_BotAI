const set503 = false/* Out of Service Mode */; const TestServer = ''/* Server ID */;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const { MessageAttachment, MessageEmbed, MessageButton, MessageActionRow, InteractionCollector, messageSent } = require('discord.js');
const keepAlive = require('./keepalive.js');
const config_1 = tslib_1.__importDefault(require("./config"));
const commands_1 = tslib_1.__importDefault(require("./commands"));
const OpenAI = require("openai");
const fs = require('fs');
const today = new Date();
const { intents, prefix, token, apiKey, userSettings } = config_1.default;
const client = new discord_js_1.Client({
  intents,
  presence: {
    status: 'online', // online, offline, idle
    activities: [{
      name: `${prefix}help`,
      type: 'LISTENING'
    }]
  }
});
const openai = new OpenAI({
  apiKey: apiKey
});

// Files
const conversation_history_file = 'conversation_history.json';
const instructions_file = 'instructions.txt';
const servers_file = 'servers.txt';
const msglogs_file = 'msglogs.txt';

// Load conversation history from file
let conversationHistory = {};
if (fs.existsSync(conversation_history_file)) {
  if (fs.statSync(conversation_history_file).size > 0) {
    conversationHistory = JSON.parse(fs.readFileSync(conversation_history_file, 'utf-8'));
  } else {
    fs.unlinkSync(conversation_history_file);
  }
}

// Date
const date = today.toLocaleDateString();
// SPAM
const messageCooldowns = new Map();

if (!fs.existsSync(conversation_history_file)) {
  fs.writeFileSync(conversation_history_file, JSON.stringify(conversationHistory));
}

client.on('ready', () => {
  console.log(`Logged in as: ${client.user?.tag}`);
});

let serverCount = 0;
const CHANNEL_NAME = userSettings?.bot_channel || '〢🤖・𝐂𝐲𝐛𝐞𝐫𝐀𝐈';
const RULE_NAME = userSettings?.bot_rule || 'IA';
const RULE_COLOR = userSettings?.rule_color || '#9b59b6';

client.on('guildCreate', guild => {
  // console.log(`Joined a new guild: ${guild.name}`);

  // Count the total number of servers the bot is in
  serverCount = client.guilds.cache.size;

  fs.writeFileSync(servers_file, `Server count: ${serverCount}\n`);

  client.guilds.cache.forEach(guild => {
    fs.appendFileSync(servers_file, `ID: ${guild.id} | Name: ${guild.name}\n`);
  });

  // Check if channel already exists
  const channelExists = guild.channels.cache.find(channel => channel.name === CHANNEL_NAME);

  // Create channel if it doesn't exist
  if (!channelExists) {
    guild.channels.create(CHANNEL_NAME, {
      type: 'text',
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
        }
      ]
    })
      .then(channel => {
        // console.log(`Channel created: ${channel.name}`);

        channel.guild.roles.create({
          name: RULE_NAME,
          color: RULE_COLOR,
        }).then(role => {
          channel.permissionOverwrites.edit(role, {
            SEND_MESSAGES: true,
            VIEW_CHANNEL: true,
          });
        });

        // Send welcome message
        channel.send(`\nHello, I\'m ${userSettings?.bot_name || 'CyberAI'}! How can I help you today?`);
        const embed = new discord_js_1.MessageEmbed()
          .setColor(RULE_COLOR)
          .setThumbnail(client.user.displayAvatarURL())
          .setDescription('Welcome to the AI Assistant channel!')
          .addField('Need help?', `Just type \`${prefix}help\` to see available commands.`)
          .setFooter(`Created by Kun.`);

        const websiteButton = new discord_js_1.MessageButton()
          .setLabel('🌐 Visit My Project')
          .setStyle('LINK')
          .setURL('https://github.com/0x00K1/Discord_BotAI');

        const inviteButton = new discord_js_1.MessageButton()
          .setLabel('🤖 Add To Server')
          .setStyle('LINK')
          .setURL(`${userSettings?.bot_invite_URL || 'https://discord.com/api/oauth2/authorize?client_id=1053098202661933126&permissions=3841650589264&scope=bot'}`);

        const buttonRow = new discord_js_1.MessageActionRow()
          .addComponents(websiteButton, inviteButton);

        channel.send({ embeds: [embed], components: [buttonRow] });
      })
  }
});

client.on('guildDelete', (guild) => {
  // console.log(`Left ${guild.name} (${guild.id})`);

  // Update servers count and list
  const servers = client.guilds.cache.size;
  fs.writeFileSync(servers_file, `Servers: ${servers}\n\n`, 'utf-8');
  client.guilds.cache.forEach((guild) => {
    fs.appendFileSync(servers_file, `${guild.name} (${guild.id})\n`, 'utf-8');
  });

  // Remove guild from file
  const data = fs.readFileSync(servers_file, 'utf-8');
  const newData = data.replace(`${guild.name} (${guild.id})\n`, '');
  fs.writeFileSync(servers_file, newData, 'utf-8');
});

client.on('messageCreate', async (message) => {
  try {
    // console.log(message.content);
    if(message.content === null)
      return;

    // Channel Check!!
    if (message.author.bot || message.channel.name !== CHANNEL_NAME)
      return;
    
    // Write message log to file
    const logMessage = `${message.author.username} (${message.author.id}) said "${message.content}" in ${message.channel.name} (${message.channel.id}) on ${message.guild.name} (${message.guild.id}) at ${new Date().toLocaleString()}\n`;
    fs.appendFile(msglogs_file, logMessage, (err) => {
      if (err) throw err;
      // console.log(logMessage);
    });

    if (set503 && message.guild.id !== TestServer) {
      message.reply('`Out of Service 503`')
        .then(message => message.react("🚫"));
      return;
    }

    // SPAM
    if (messageCooldowns.has(message.author.id)) {
      const lastMessageTimestamp = messageCooldowns.get(message.author.id);
      const elapsedTime = message.createdTimestamp - lastMessageTimestamp;
      if (elapsedTime < 3000) {
        // message.delete(); 
        return; // await message.reply('<@' + message.author.id + `>, Don't SPAM.`).then(message => message.react("⚠️")); 
      }
    }
    messageCooldowns.set(message.author.id, message.createdTimestamp);

    if (message.content.length > 280) {
      return message.reply('<@' + message.author.id + `>, Your message is too long. Please keep it under 280 characters.`);
    }

    const userId = message.author.id;
    let conversation = [];

    // Load conversation history from file
    if (fs.existsSync(conversation_history_file)) {
      conversationHistory = JSON.parse(fs.readFileSync(conversation_history_file, 'utf-8'));
      if (userId in conversationHistory) {
        conversation = conversationHistory[userId];
      }
    }

    // Check if we have conversation history for this user
    if (!(userId in conversationHistory)) {
      conversationHistory[userId] = [];
    }
    conversation = conversationHistory[userId];

    // Read instructions from file
    const instructions = fs.readFileSync(instructions_file, 'utf8');

    // Replace variables in instructions with actual values
    let prompt = instructions.replace(/\{([^}]+)\}/g, (_, key) => {
      if (userSettings?.hasOwnProperty(key) || false) {
        return userSettings[key];
      } else {
        switch (key) { /* DEFAULT VALUES */
          case 'bot_name': return 'CyberAI';
          case 'bot_website': return 'https://0x00K1.github.io/CyberAI';
          case 'prefix': return '$';
          case 'programmer_name': return 'kun';
          case 'programmer_username': return '0x001.';
          case 'programmer_id': return '530465495040917531';
          case 'discord_server': return 'https://discord.gg/8aYnhaBqGY';
          case 'bot_invite_URL': return 'https://discord.com/api/oauth2/authorize?client_id=1053098202661933126&permissions=3841650589264&scope=bot';
          case 'programmer_website': return 'https://CyberKun.com';
          case 'support_website': return 'https://0x00k1.github.io/CyberAI/support';
          case 'programmer_social_media_twitter': return 'https://twitter.com/CityMuhannad';
          case 'programmer_social_media_github': return 'https://github.com/0x00K1';
          case 'server_name': return message.guild.name;
          case 'channel_name': return message.channel.name;
          case 'user_name': return message.author.username;
          case 'user_id': return message.author.id.toString();
          case 'today': return today;
          case 'date' : return date;
          default: return `{${key}}`;
        }
      }
    });

    // Calculate the total length of the conversation history
    const totalLength = conversation.reduce((acc, curr) => acc + curr.length, 0);

    prompt += '';
    for (let i = 0; i < conversation.length; i++) {
      if (i % 2 == 0) {
        prompt += `${message.author.username}: ${conversation[i]}\n`;
      } else {
        prompt += `${userSettings?.bot_name || 'CyberAI'}: ${conversation[i]}\n`;
      }
    }

    // Set max tokens based on the length of the conversation history
    let tokens = 5000;
    let maxTokens = tokens - totalLength;
    if (maxTokens <= 0) {
      maxTokens = 0;
      // Send an error message to the user
      const tokenCountEmbed = new MessageEmbed()
        .setColor('#FF0000')
        .setTitle('TOKEN ALERT')
        .setDescription('<@' + message.author.id + `>, You have used ` + '`' + `${tokens - maxTokens}` + '`' + ' tokens out of a maximum of ' + '`' + `${tokens}` + '`' + ' tokens.\n\nYou can save your conversation history by typing' + ` ${prefix}history ` + 'before resetting.\n\n**To reset, click the "Reset Token Count" button below.**');

      const tokenCountEmbedDone = new MessageEmbed()
        .setColor('#00FF00')
        .setTitle('TOKEN ALERT')
        .setDescription('<@' + message.author.id + `>, Your token count has been reset!\n\nYou can now continue using the bot with a fresh token count.\n\n` + `**Token Check** 🡺 ${prefix}TC \n` + `**Conversation history** 🡺 ${prefix}history`);

      const resetButton = new MessageButton()
        .setCustomId('resetTokenCount')
        .setLabel('Reset Token Count')
        .setStyle('DANGER');

      const row = new MessageActionRow().addComponents(resetButton);

      const messageWithButton = await message.reply({
        embeds: [tokenCountEmbed],
        components: [row]
      });

      const expiredButton = new MessageButton()
        .setCustomId('delete-history')
        .setLabel('Expired')
        .setStyle('SECONDARY')
        .setEmoji('⌛')
        .setDisabled(true);

      const expiredRow = new MessageActionRow().addComponents(expiredButton);

      let embed = tokenCountEmbed;
      let components = [row];

      setTimeout(async () => {
        if (embed === tokenCountEmbed) {
          embed = tokenCountEmbed;
          components = [expiredRow];
        }
        await messageWithButton.edit({
          embeds: [embed],
          components: components
        });
      }, 60000); // 1 minute timeout

      const filter = i => i.customId === 'resetTokenCount';
      const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id === userId) {
          delete conversationHistory[userId];
          fs.writeFileSync(conversation_history_file, JSON.stringify(conversationHistory));

          const doneButton = new MessageButton()
            .setCustomId('delete-history')
            .setLabel('History deleted')
            .setStyle('SUCCESS')
            .setEmoji('✅')
            .setDisabled(true);

          const doneRow = new MessageActionRow().addComponents(doneButton);

          embed = tokenCountEmbedDone;
          components = [doneRow];

          await i.update({
            embeds: [embed],
            components: components
          });

          collector.stop();
        } else {
          await i.update({
            content: `⚠️ Only <@${userId}> can reset their token.`,
          });
        }
      });

      collector.on('end', async collected => {
        if (collected.size === 0) {
          if (embed === tokenCountEmbed) {
            components = [expiredRow];
          }
          await messageWithButton.edit({
            embeds: [embed],
            components: components
          });
        }
      });
      return;
    }
    if (!message.content.startsWith(prefix)) {

      // Comment
      if (message.content.startsWith('#')) {
        message.react('👀');
        return;
      }

      // console.log(maxTokens);
      // ChatGPT API
      try {
        const openFun=async()=>{
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt + `${message.author.username}:${message.content}\n${userSettings?.bot_name || 'CyberAI'}:` }],
        });
        const botResponse = response.choices[0].message.content;

        conversation.push(message.content);
        conversation.push(botResponse);

        fs.writeFileSync(conversation_history_file, JSON.stringify(conversationHistory));

        if (botResponse.length > 0) {
          await message.reply('<@' + message.author.id + '>\n' + botResponse);
        } else {
          console.error('OpenAI API response has no choices.');
        }
        }
        openFun();
      } catch (error) {
        console.error(error);
        await message.reply(`<@${message.author.id}>` + '\n' + `This message typically appears when you try DM me or there is an issue with sending a request or uncompleting a task. It could be due to a variety of factors, such as an issue with the system or network, or a problem with the request itself i.g: The reply contnet must be 2000 or fewer in length to completing the request. If you continue to see this message and are unable to complete your request, it may be helpful to try again later or to contact the creator of the system or service you are using for further assistance. They may be able to provide additional information or troubleshoot the issue to help resolve the problem.\nSupport: ${userSettings?.support_website/server | 'https://0x00k1.github.io/CyberAI/support/'}`)
          .then(message => message.react("⚠️"));
        return;
      }
    } else {
      const args = message.content.slice(prefix.length).split(' ');
      const command = args.shift().toLowerCase();

      switch (command) {
        case 'ping':
          const msg = await message.reply('Pinging...');
          await msg.edit(`Pong! The round trip took ${Date.now() - msg.createdTimestamp}ms.`);
          break;

        case 'info':
          await message.reply(`Holla ` + `<@${message.author.id}>!` + '\n' + `I'm CyberAI, the advanced AI bot created by Kun, I am excited to introduce you to this amazing technology that I have been working on. The CyberAI bot is a program that uses artificial intelligence to perform various tasks and functions. It is designed to learn and adapt over time, allowing it to become more efficient and effective at completing tasks. The CyberAI bot is capable of learning from its experiences, making decisions based on data and information, and even communicating with users through natural language processing. I believe that this technology has the potential to revolutionize the way we interact with machines and make our lives easier and more efficient. I am excited to see where this technology takes us in the future and I hope you will join me in exploring all that the CyberAI bot has to offer.

Website:https://0x00K1.github.io/CyberAI`);
          break;

        case 'help':
          const embed = (0, commands_1.default)(message);
          embed.setThumbnail(client.user.displayAvatarURL());
          await message.reply({ embeds: [embed] });
          break;

        case 'history':
          console.log(conversation.length);
          try {
            if (conversation.length === 0) {
              await message.reply(`<@${message.author.id}>` + '\n' + `You don't have any conversation history yet.`);
            } else {
              try {
                const embed = new MessageEmbed()
                  .setTitle('Conversation History')
                  .setDescription('`conversation.txt`, Here is your conversation history in the file below . . .')
                  .setColor('#b66bff');

                const buffer = new Buffer.from(conversation.map((msg, idx) => `${idx % 2 === 0 ? 'You' : `${userSettings?.bot_name || 'CyberAI'}`}: ${msg}`).join('\n'));
                console.log(buffer.length);
                const attachment = new discord_js_1.MessageAttachment(buffer, 'conversation.txt');
                const messageObject = await message.reply(`<@${message.author.id}>`)
                  .catch((err) => {
                    console.error(err);
                    message.reply(`<@${message.author.id}>` + '\n' + `An error occurred while sending the file.`);
                  });

                const messageFile = await messageObject.reply({ embeds: [embed] });

                messageFile.reply({ files: [attachment] })
                  .catch((err) => {
                    console.error(err);
                    message.reply(`<@${message.author.id}>` + '\n' + `An error occurred while sending the File.`);
                  });
              } catch (err) {
                console.error(err);
                await message.reply(`<@${message.author.id}>`, 'An error occurred while sending the message.');
              }
            }
          } catch (err) {
            console.error(err);
            await message.reply(`<@${message.author.id}>` + '\n' + `An error occurred while retrieving your conversation history.`);
          }
          break;
        case 'reset':
          // Delete the conversation history for the user
          delete conversationHistory[userId];
          fs.writeFileSync(conversation_history_file, JSON.stringify(conversationHistory));
          await message.reply(`<@${message.author.id}>` + '\n' + `Your conversation history has been deleted.`);
          break;

        case 'tc':
          await message.reply('<@' + message.author.id + `>, You have used ` + '`' + `${tokens - maxTokens}` + '`' + ' tokens out of a maximum of ' + '`' + `${tokens}` + '`' + ' tokens.');
          break;
        default:
          // Handle invalid command
          await message.reply(`<@${message.author.id}>` + '\n' + `Invalid command. Type \`${prefix}help\` to see the list of available commands.`);
          break;
      }
    }
  } catch (error) {
    console.error(error);
    await message.reply(`<@${message.author.id}>` + '\n' + `This message typically appears when you try DM me or there is an issue with sending a request or uncompleting a task. It could be due to a variety of factors, such as an issue with the system or network, or a problem with the request itself i.g: The reply contnet must be 2000 or fewer in length to completing the request. If you continue to see this message and are unable to complete your request, it may be helpful to try again later or to contact the creator of the system or service you are using for further assistance. They may be able to provide additional information or troubleshoot the issue to help resolve the problem.\nSupport: ${userSettings?.support_website_or_server | 'https://0x00k1.github.io/CyberAI/support/'}`)
      .then(message => message.react("⚠️"));
    return;
  }
});

keepAlive();
client.login(token);