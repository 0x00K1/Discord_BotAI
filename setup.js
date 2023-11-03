const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const fetch = require('node-fetch');
const OpenAI = require("openai");
const colors = require('./colors.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const userSettings = {};

// List of keys you want the bot to use. Do with instructions.txt
const keysToInput = [
  /* Required */
  'discord_bot_token',
  'gpt_api_token',
  /* Optional */
  'bot_name',
  'bot_channel',
  'bot_rule',
  'rule_color',
  'bot_website',
  'prefix',
  'bot_invite_URL',
  'programmer_name',
  'programmer_username',
  'programmer_id',
  'discord_server',
  'programmer_website',
  'support_website_or_server',
  'programmer_social_media_github',
  'programmer_social_media_twitter',
];

async function isValidDiscordToken(token) {
  const url = 'https://discord.com/api/v10/users/@me';
  const headers = {
    Authorization: `Bot ${token}`,
  };

  try {
    const response = await fetch(url, { headers });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function isValidGptApiToken(token) {
  const openai = new OpenAI({
    apiKey: token
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' },
    ]});

    if (response && response.choices && response.choices[0] && response.choices[0].message) {
      return true; 
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

function validatePrefix(input) {
  return /^[^\s]{1,3}$/.test(input) ? input : null;
}

function validateBotChannel(input) {
  const lowercaseInput = input.toLowerCase();
  return lowercaseInput.length >= 1 && lowercaseInput.length <= 27 ? lowercaseInput : null;
}

function validateBotRule(input) {
  const lowercaseInput = input.toLowerCase();
  return /^[a-z0-9]{1,16}$/.test(lowercaseInput) ? lowercaseInput : null;
}

function validateRuleColor(input, callback) {
  const normalizedColorName = input.toLowerCase();

  if (colors.hasOwnProperty(normalizedColorName)) {
    const colorCode = colors[normalizedColorName];
    callback(colorCode); // Call the callback with the color code
  } else {
    callback(null); // Call the callback with null for an invalid color name
  }
}

async function getUserInput(keyIndex) {
  if (keyIndex >= keysToInput.length) {
    rl.close();
    writeUserSettingsToFile();
    return;
  }

  const key = keysToInput[keyIndex];

  if (key === 'discord_bot_token' || key === 'gpt_api_token') {
    rl.question(`Enter value for "${key}": `, async (answer) => {
      if (answer.trim() === '') {
        console.log(`Invalid ${key}. Please provide a valid token.`);
        getUserInput(keyIndex);
      } else {
        const isValidToken = key === 'discord_bot_token'
          ? await isValidDiscordToken(answer)
          : await isValidGptApiToken(answer);

        if (isValidToken) {
          userSettings[key] = answer;
          getUserInput(keyIndex + 1);
        } else {
          console.log(`Invalid ${key}. Please provide a valid token.`);
          getUserInput(keyIndex);
        }
      }
    });
  } else {
    rl.question(`Enter value for "${key}": `, (answer) => {
      let validatedValue = userSettings[key] || '';

      if (answer.trim() === '') {
        console.log(`No input provided for "${key}". Using default value.`);
      } else {
        switch (key) {
          case 'prefix':
            validatedValue = validatePrefix(answer);
            break;
          case 'bot_channel':
            validatedValue = validateBotChannel(answer);
            break;
          case 'bot_rule':
            validatedValue = validateBotRule(answer);
            break;
          case 'rule_color':
            validateRuleColor(answer, (colorCode) => {
              if (colorCode) {
                userSettings[key] = colorCode;
                getUserInput(keyIndex + 1);
              } else {
                console.log(`Invalid color name. Please provide a valid color name.\n[!] Enter color name in English | e.g > Black`);
                getUserInput(keyIndex);
              }
            });
            return;
          default:
            validatedValue = answer;
        }

        if (validatedValue === null) {
          console.log(`Invalid input for "${key}". Using default value.`);
        } else {
          userSettings[key] = validatedValue;
        }
      }

      getUserInput(keyIndex + 1);
    });
  }
}

function writeUserSettingsToFile() {
  const settingsJson = JSON.stringify(userSettings, null, 2);
  fs.writeFile('userSettings.json', settingsJson, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log('User settings have been saved to userSettings.json\n\n');
      console.log("Congrats!! You can run the bot with your identity.\n[#] node index.js");
      
      // Run "node index.js"
      const child = spawn('node', ['index.js']);

      child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      child.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
      });
    }
  });
}

console.log('Welcome! Please enter the following settings:');
getUserInput(0);
