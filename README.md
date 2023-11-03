# Discord AI Bot

This Discord bot integrates OpenAI's GPT-3.5 to provide an interactive chat experience within Discord servers. The bot is equipped with several features that make it a helpful assistant for users, such as managing conversation history and providing detailed command information.

## Features

- **Natural Language Understanding**: Leverages OpenAI's GPT-3.5 for sophisticated conversation capabilities.
- **Dynamic Help Menu**: Offers a comprehensive list of commands and their usage.
- **Conversation History**: Maintains a record of interactions for a personalized experience.
- **Token Management**: Monitors API token usage to stay within operational limits.
- **Customizable Settings**: Allows configuration of bot behavior and appearance.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js installed on your system.
- A Discord account with permissions to add a bot to a server.
- An OpenAI API key.

## Installation

To set up the Discord AI Bot, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/0x00K1/Discord_BotAI.git
   ```
2. Navigate to the project directory:
   ```sh
   cd Discord_BotAI
   ```
3. Install the necessary packages:
   ```sh
   npm install
   ```

## Configuration

Run the `setup.js` script to interactively configure your bot settings:

```sh
node setup.js
```

This will prompt you for various tokens and preferences to populate the `userSettings.json` file.

## Usage

To start the bot, run:

```sh
node index.js
```

Once the bot is running, it will log in to Discord and be ready to interact with users in the servers it has been added to.

## Commands

The bot recognizes the following commands:

- `help`: Displays a list of available commands and their details.
- `ping`: Tests connectivity with Discord's servers.
- `info`: Provides information about the bot's capabilities.
- `reset`: Clears the user's conversation history with the bot.
- `tc`: Checks the user's token usage.
- `history`: Retrieves the user's conversation history with the bot.

## Development

The bot's functionality is divided into several scripts:

- `index.js`: The entry point of the bot.
- `setup.js`: A script for setting up user configurations.
- `config.js`: A module exporting the configuration settings.
- `commands.js`: Contains the implementation of bot commands.

## Acknowledgments

- OpenAI for providing the API for conversational AI.
- The Discord.js team for the library that powers this bot.

## Support

For support, Discord: `0x001.` or join our Discord server `https://discord.gg/8aYnhaBqGY`.
