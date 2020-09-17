const { Client, MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const config = require("./config.json");

const prefix = config.prefix;
const queue = new Map();
const client = new Client();

client.on("ready", () => 
{
    console.log(`Instance successfully logged in as ${client.user.tag} | ${client.user.id}`);
    client.user.setStatus("online");
    client.user.setActivity("music", {type: "LISTENING"})
})

client.on("message", async msg => {
    console.log("Recived event");
    if(msg.author.bot) return;
    if(!msg.content.startsWith(prefix)) return;

    const args = msg.content.substring(prefix.length).split(" ");
    const serverQueue = queue.get(msg.guild.id);

    if(msg.content.startsWith(`${prefix}play`))
    {
        const voice_channel = msg.member.voice.channel;
        if(!voice_channel) return msg.channel.send(config.no_voice_error_message).catch(() => console.log("Couldn't send message"));
        const permission = voice_channel.permissionsFor(msg.client.user);
        if(!permission.has("CONNECT")) return msg.channel.send(config.no_perm_for_join_error_message).catch(() => console.log("Couldn't send message"));
        if(!permission.has("SPEAK")) return msg.channel.send(config.no_perm_for_play_error_message).catch(() => console.log("Couldn't send message"));
    
        const songInfo = await ytdl.getInfo(args[1]);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url
        }

        if(!serverQueue)
        {
            const queueContruct = {
                textChannel: msg.channel,
                voiceChannel: voice_channel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            }

            queue.set(msg.guild.id, queueContruct);

            queueContruct.songs.push(song);

            try
            {
                queueContruct.connection = await voice_channel.join();
                play(msg.guild, queueContruct.songs[0]);
            }
            catch(error)
            {
                console.log(`There was an error connecting the voice channel: ${error}`);
                queue.delete(msg.guild.id);
                return msg.channel.send(`There was an error connecting the voice channel: ${error}`);
            }

        }
        else
        {
            serverQueue.songs.push(song);
            return msg.channel.send(`**${song.title}** has been added to the queue`);
        }
        return undefined;
    } 
    else if(msg.content.startsWith(`${prefix}stop`)) 
    {
        if(!msg.member.voice.channel) return msg.channel.send(config.no_voice_error_message).catch(() => console.log("Couldn't send message"));
        if(!serverQueue) return msg.channel.send("There is nothing playing");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        msg.channel.send(":ok_hand: | Stopped playing");
        return undefined;
    }
    else if(msg.content.startsWith(`${prefix}invite`))
    {
        const embed = new MessageEmbed()
            .setTitle("Invite me!")
            .setDescription(`[Click me](https://discord.com/api/oauth2/authorize?client_id=${config.client_id}&scope=bot&permissions=8)`)
            .setFooter("Template by MauricePascal - https://github.com/MauricePascal/d.js-music")
            .setColor(0x03fce8);

        msg.channel.send({embed: embed});
    }
    else if(msg.content.startsWith(`${prefix}skip`))
    {
        if(!msg.member.voice.channel) return msg.channel.send(config.no_voice_error_message);
        if(!serverQueue) return msg.channel.send("Nothing to play");
        serverQueue.connection.dispatcher.end();
        msg.channel.send(":ok_hand: | Skipped the music for you");
        return undefined;
    }

})

function play(guild, song)
{
    const serverQueue = queue.get(guild.id);

    if(!song)
    {
        serverQueue.voiceChannel.leave();
        serverQueue.textChannel.send(":tada: The party is over. I left the channel");
        queue.delete(guild.id);
        return;
    }

    const dispatcher = connection.play(ytdl(song.url))
    .on('finish', () => {
        serverQueue.song.shift();
        play(guild, serverQueue.songs[0]);
    })
    .on('error', error => {
        console.log(error);
        return msg.channel.send(config.track_not_found_error);
    })
    dispatcher.setVolumeLogarithmic(5 / 5);
}

client.login(config.token)