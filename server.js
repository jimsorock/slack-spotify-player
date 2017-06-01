const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 8080
const SpotifyWebApi = require('spotify-web-api-node')

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID || 'foo',
    clientSecret: process.env.CLIENT_SECRET || 'bar',
    redirectUri: process.env.REDIRECT_URI || 'google.com'
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
            const item = data.body.item
            const title = `${item.name} by ${item.artists[0].name}`
            res.json({
                attachments: [
                    {
                        fallback: title,
                        title: title,
                        title_link: item.external_urls.spotify,
                        image_url: item.album.images[0].url,
                        color: "#84bd00"
                    }
                ]
            })
        })
        .catch(reason => {
            res.json(reason)
        })
})

app.listen(port, () => {
    console.log(`Magic happens on port: ${port}`)
})