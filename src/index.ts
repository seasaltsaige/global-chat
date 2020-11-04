import { config } from "dotenv";
config();
import { Client, Collection, TextChannel } from "discord.js";
const client = new Client();
const searchingChannels = new Collection<string, TextChannel>();
const talking = new Collection<string, string>();
const prefix = "!";

client.on("ready", () => console.log(`${client.user.username} logged into ${client.guilds.cache.size} guilds.`));

client.on("message", async message => {
    const args = message.content.slice(prefix.length).trim().split(" ");
    const command = args.shift();

    if (message.author.bot) return;

    if (talking.get(message.channel.id)) {
        const recipient = <TextChannel>client.channels.cache.get(talking.get(message.channel.id));
        recipient.send(`**${message.author.username}**#${message.author.discriminator} 🌐 ${message.content}`, { files: message.attachments.array() });
        recipient.stopTyping(true);
    }

    if (!message.content.startsWith(prefix)) return;
    if (!message.guild) return;
    if (!command) return;

    switch (command) {
        case "search":

            if (searchingChannels.get(message.guild.id)) return message.channel.send(`🚫 There is already a search going in ${searchingChannels.get(message.guild.id)}`);
            for (const chId of talking.array()) {
                if (message.guild.channels.cache.array().some(c => c.id === chId)) return message.channel.send(`🚫 There is already a chat going in ${message.guild.channels.cache.get(chId)}`);
            }

            searchingChannels.set(message.guild.id, <TextChannel>message.channel);

            if (searchingChannels.size < 2) return message.channel.send("Please wait for another server to connect!");
            else {
                const serversToChoose = searchingChannels.array().filter(c => c.id !== message.channel.id);
                const random = Math.floor(Math.random() * serversToChoose.length);

                const connection = serversToChoose[random];

                searchingChannels.delete(message.guild.id);
                searchingChannels.delete(connection.guild.id);

                talking.set(message.channel.id, connection.id);
                talking.set(connection.id, message.channel.id);

                message.channel.send("✅ Connection established! You can now chat!").then(m => m.delete({ timeout: 7000 }));
                connection.send("✅ Connection established! You can now chat!").then(m => m.delete({ timeout: 7000 }));
            }

        break;

        case "cancel":
            if (searchingChannels.get(message.guild.id)) {
                searchingChannels.delete(message.guild.id);
                message.channel.send("🚫 Successfully left the connection queue.");
            } else message.channel.send("🚫 You have no connnection queued to end.");
        break;

        case "end":
            if (talking.get(message.channel.id)) {
                const Ender = message.channel.id;
                const Recipient = talking.get(Ender);

                message.channel.send("🚫 You have ended the connection.");
                (<TextChannel>client.channels.cache.get(Recipient)).send("🚫 The other end has terminated the connection.");

                talking.delete(Ender);
                talking.delete(Recipient);
            } else message.channel.send("🚫 You have no connection to end.");
        break;
    }

    client.on("typingStart", async (channel, user) => {
        if (talking.get(channel.id) && user.id !== client.user.id) {
            const recipientChannel = <TextChannel>client.channels.cache.get(talking.get(channel.id));
            recipientChannel.startTyping();
        }
    });

});

client.login(process.env.TOKEN);