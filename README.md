# Evil-Micheal
Discord music bot that plays local mp3 files.

## Authentication

In the same directory as the 'index.js', create the file 'config.json'. This file will contain the authentication credentials to your Discord Developer application.

Example contents:

```
{
  "bot_token": "<your bot's token>",
  "bot_client_id": "<your bot's client ID>"
}
```
The bot_token can be generated on the Bot tab of your applicaiton in Discord Developer:
<img width="1338" height="412" alt="image" src="https://github.com/user-attachments/assets/4a5c401e-ca68-41b4-9324-fd0022984156" />

The bot_client_id is the Application ID of your application in Discord Developer:
<img width="1670" height="626" alt="image" src="https://github.com/user-attachments/assets/a512168f-013b-4f62-ae87-54cd7325cae8" />

## Songs

In the same director as the 'index.js', create a folder called 'songs'. Any MP3 files you want the bot to play should be stored here

## Running the bot

Once authentication and songs are setup, run the following to start the bot:
```
node index.js
```
