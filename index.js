// Import Discord.js library 
const Discord = require('discord.js');

const {REST} = require('@discordjs/rest');

const {Routes} = require('discord-api-types/v9');

const fs = require('fs');

const {
	joinVoiceChannel,
	getVoiceConnection,
	createAudioPlayer,
	createAudioResource,
	NoSubscriberBehavior,
	AudioPlayerStatus 
} = require('@discordjs/voice');

//File system parameters
const songDirectory = './songs/';
const configFilePath = './config.json';

//Bot Identity
const configFile = require(configFilePath);
const bot_token = configFile.bot_token;
const bot_client_id = configFile.bot_client_id;

//Song parameters
let currentSongId = -1;
let songList = fs.readdirSync(songDirectory);
let songListStr = generateSongList(songList);
let randomEnabled = false;

const rest = new REST({
	version: '9'
}).setToken(bot_token);

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Pause,
	},
});

// Create Discord client instance 
const client = new Discord.Client({ intents: [
  Discord.GatewayIntentBits.Guilds,
  Discord.GatewayIntentBits.GuildMessages,
  Discord.GatewayIntentBits.MessageContent,
  Discord.GatewayIntentBits.GuildVoiceStates
]});

// Ready event triggers when bot connects to Discord 
client.on('clientReady', async () => {
  await registerCommands();
  console.log('Bot started successfully!');
});

// Ping command 
client.on('messageCreate', msg => {
  console.log(msg.member.displayName + ": " + msg.content);
});

function nextSong()
{
	if (randomEnabled)
	{
		currentSongId = Math.floor(Math.random()*songList.length);
	}
	else
	{
		//reset the song index when it reaches the end of the playlist
		if (currentSongId > songList.length)
		{
			currentSongId = -1;
		}
		currentSongId++;
	}
	const songName = songList[currentSongId];
	const resource = createAudioResource(songDirectory + songName);
	player.play(resource);	
}

//keep playing after a song ends. Will only run when currentSongId > -1
player.on(AudioPlayerStatus.Idle, () => {
	if (currentSongId >= 0)
		nextSong();
});

//command functionality
client.on('interactionCreate', async (interaction) => {
	if (!interaction.isCommand()) return;
	
	const {commandName, options} = interaction;
	
    const voiceConnection = getVoiceConnection(interaction.member.guild.id);
	
	switch (commandName)
	{
		//Join command will make the bot join your current channel
		case 'join':
			const channelId = interaction.member.voice.channelId;
	   
			if (channelId === null)
			{
				await interaction.reply({content: 'Error: You are not in any channel'});
			}
			else
			{
				const connection = joinVoiceChannel({
					channelId: channelId,
					guildId: interaction.member.guild.id,
					adapterCreator: interaction.member.guild.voiceAdapterCreator,
				}); 
				await interaction.reply({content: 'Joining Channel'});
			}
			break;
		//Leave command will make the bot leave your channel
		case 'leave':
			try
			{
				currentSongId = -1;
				voiceConnection.destroy();
				player.stop();
				await interaction.reply({content: 'Leaving Channel'});
			}
			catch
			{
				await interaction.reply({content: 'Error: Not in any channel'});
			}
			break;
		//Lists the songs available
		case 'songlist':
			await interaction.reply({content: songListStr});
			break;
		//Play a song based on an ID from /songlist
		case 'play':
		    if (voiceConnection === undefined)
			{
				await interaction.reply({content: "Error: Not in any voice channel"});
				return;
			}
		
			currentSongId = Number(options.getString('song_id'));
			
			if (currentSongId >= songList.length || currentSongId < 0)
			{
				await interaction.reply({content: "Error: Not a valid song id, please check /songlist"});
				return;
			}
			
			const songName = songList[currentSongId];
			const resource = createAudioResource(songDirectory + songName);
			voiceConnection.subscribe(player);
			player.play(resource);  
			await interaction.reply({content: "Playing: " + songName});
			
			break;
	    //reloads available songs in /songs
		case 'refresh':
			songList = fs.readdirSync(songDirectory);
			songListStr = generateSongList(songList);
			await interaction.reply({content: "Song list refreshed"});
			break;
		//stops the current song
		case 'stop':
			try
			{
				currentSongId = -1;
				voiceConnection.subscribe(player);
				player.stop();
				await interaction.reply({content: "Stopping song"});
			}
			catch
			{
				await interaction.reply({content: "Error: not in any voice channel"});
			}
			break;
		case 'shuffle':
			if (randomEnabled)
			{
				randomEnabled = false;
				await interaction.reply({content: "Shuffle Disabled"});
			}
			else
			{
				randomEnabled = true;
				await interaction.reply({content: "Shuffle Enabled"});
			}
			break;
		case 'skip':
			nextSong();
			await interaction.reply({content: "Current song skipped"});
			break;
	}
});

//register commands
async function registerCommands() {
	try {
		const commands = [
		   {
				name: 'join',
				description: 'Join a voice channel',
			},
			{
				name: 'leave',
				description: 'Disconnect from the voice channel',
			},
			{
				name: 'songlist',
				description: 'List the songs available to play'
			},
			{
				name: 'play',
				description: 'Play a single song by its index number. Use /songlist to see available songs.',
				options: [{
					name: 'song_id',
					description: 'The id of the song from /songlist',
					type: 3, // Numeric value for STRING type
					required: true,
				}, ],
			},
			{
				name: 'refresh',
				description: 'Refresh song playlist'
			},
			{
				name: 'stop',
				description: 'Stops the songs from playing'
			},
			{
				name: 'shuffle',
				description: 'Enables random song play'
			},
			{
				name: 'skip',
				description: 'Skips the current song'
			},
		];

		await rest.put(
			Routes.applicationCommands(bot_client_id), {
				body: commands
			},
		);
	} catch (error) {
		console.error(error);
	}
}

function generateSongList(songList)
{
	let returnStr = '';
	
	for (var i = 0; i < songList.length; i++)
	{
		returnStr = returnStr + "\n" + i + ": " + songList[i];
	}
	
	return returnStr;
}

// Log in using token from Discord dev application 
client.login(bot_token);
