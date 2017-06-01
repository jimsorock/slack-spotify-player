# slack-spotify-player
Simple Spotify/Slack integration app

Node/Express app that accepts a POST request and returns the currently playing track for the authorized user (OAuth). To authorize you must first vist /auth endpoint and authorize the app to connect to your spotify account. 
Currently scope of Spotify permissions is: user-read-playback-state
