const Discord = require('discord.js');
const Config = require('./config.json');
const { CFToolsClientBuilder, Game } = require('cftools-sdk');

const Client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

process.on('SIGINT', () => {
    console.info("Interrupted")
    process.exit(0)
});

console.log('Starting Discord Bot...');

Client.once('ready', async () => {
    console.log(`Connected to Discord as user ${Client.user.username}.`);

    Client.user.setPresence({
        status: 'idle',
        activities: [{
            name: Config.PRESENCE_NAME,
            type: Config.PRESENCE_TYPE,
        }]
    });

    const CFClient = new CFToolsClientBuilder().build();

    setInterval(async () => {
        try {
            const details = await pollGameServerDetails(CFClient, Config.SERVER);
            let playerStats = details.status.players;
            console.log(`Polled server ${Config.SERVER.NAME} (${Config.SERVER.CFTOOLS_HOSTNAME}:${Config.SERVER.CFTOOLS_PORT})...`);

            const channel = await Client.channels.fetch(Config.SERVER.CHANNEL_ID);
            let newChannelName;
            if (details.online) {
                newChannelName = `${Config.SERVER.NAME}: ${playerStats.online}/${playerStats.slots}`;
            } else {
                newChannelName = `${Config.SERVER.NAME}: offline`;
            }

            if (playerStats.queue > 0) {
                    newChannelName = `${newChannelName} (+${playerStats.queue})`;
                }

            if (channel.name === newChannelName) return;

            console.log(`Setting channel name: ${newChannelName}`);
            await channel.setName(newChannelName);
        } catch (error) {
            console.error('Error updating server status:', error);
        }
    }, Config.POLLING_INTERVAL * 1000);
});

Client.login(Config.BOT_TOKEN);

async function pollGameServerDetails(CFClient, server) {
    return await CFClient.getGameServerDetails({
        game: Game.DayZ,
        ip: server.CFTOOLS_HOSTNAME,
        port: server.CFTOOLS_PORT,
    });
}