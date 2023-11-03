  "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs = require('fs');
const userSettings_file = 'userSettings.json';
let userSettings;

if (fs.existsSync(userSettings_file)) {
  if (fs.statSync(userSettings_file).size > 0) {
    userSettings = JSON.parse(fs.readFileSync(userSettings_file, 'utf8'));
  } else {
    fs.unlinkSync(userSettings_file);
  }
}
// Check if the require values exist.
if (!userSettings || !userSettings.discord_bot_token || !userSettings.gpt_api_token) {
  console.error('[x] Missing require keys in userSettings.json. Please run setup.js to configure the bot.\n[#] node setup.js');
  process.exit(1);
}

exports.default = {
    prefix: userSettings?.prefix || '$',
    token: userSettings.discord_bot_token, // Bot token
    apiKey: userSettings.gpt_api_token, // GPT API token
    intents: [
        discord_js_1.Intents.FLAGS.GUILDS,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
    ],
    userSettings
};
//# sourceMappingURL=config.js.map
