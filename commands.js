"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const config_1 = tslib_1.__importDefault(require("./config"));
const { prefix } = config_1.default;
const commands = {
    'help': {
        description: 'Shows the list of commands and their details.',
        format: `${prefix}help`
    },
    'Ping': {
        description: 'Checks connectivity with discord\'s servers.',
        format: `${prefix}ping`
    },
    'About me': {
        description: 'Provide information about me, the Assistant, including my training data and capabilities.',
        format: `${prefix}INFO`
    },
    'My Memory': {
        description: 'Allows you to delete the previous conversations with me. (Clearing my memory)',
        format: `${prefix}reset`
      },
    'Commments': {
        description: 'For comments, I\'ll not grep the request.',
        format: '# <comment>'
    },
    'Token Check': {
        description: 'Provides information about the number of tokens that a user has used out of a maximum limit.',
        format: `${prefix}TC`
    },
    'Conversation History': {
        description: 'Shows a file of all previous conversations between you and the Assistant.',
        format: `${prefix}history`
    },
};
function helpCommand(message) {
    const footerText = message.author.tag;
    const footerIcon = message.author.displayAvatarURL();
    const embed = new discord_js_1.MessageEmbed()
        .setTitle('HELP MENU')
        .setColor('PURPLE')
        .setFooter(footerText, footerIcon);;
    for (const commandName of Object.keys(commands)) {
        const command = commands[commandName];
        let desc = command.description;
        if (command.aliases)
            desc += `**Aliases :** ${command.aliases.join(', ')}\n\n`;
        desc += '\n\n**Format**\n```' + command.format + '```' + '\n᲼\n\n';
        embed.addField(commandName, desc, false);
    }
    return embed;
}
exports.default = helpCommand;
//# sourceMappingURL=commands.js.map