const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const SpotifyWebApi = require('spotify-web-api-node')

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID || 'foo',
    clientSecret: process.env.CLIENT_SECRET || 'bar',
    redirectUri: process.end.REDIRECT_URI || 'google.com'
});

const scopes = ['user-read-playback-state'],
    state = 'slack-spotify'

app.get('/auth', (req, res) => {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
    res.redirect(authorizeURL)
})

app.use('/auth-callback', (req, res) => {
    spotifyApi.authorizationCodeGrant(req.query.code)
        .then(function (data) {
            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            res.send('success')
        })
        .catch(reason => {
            console.log('Something went wrong!', reason)
        })
})

app.post('/whatsplaying', (req, res) => {
    spotifyApi.getMyCurrentPlaybackState()
        .then((data) => {
            res.json({
                text: data.body.item.artists[0].name
            })
        })
        .catch(reason => {
            res.json(reason)
        })
})

app.listen(port, () => {
    console.log(`Magic happens on port: ${port}`)
})