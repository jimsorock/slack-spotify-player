const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 8080
const SpotifyWebApi = require('spotify-web-api-node')
const https = require('https')

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
            
            spotifyApi.getMyCurrentPlaybackState()
            .then(({body: {item: track}}) => {
                res.json(slackAttachmentResponse(track))
            })
            .catch(reason => {
                res.json(reason)
            })
        })
        .catch(reason => {
            res.json({
                status: 'failed to authorize'
            })
            console.log('Something went wrong!', reason)
        })
})

app.get('/', (req, res) => {
    res.send('nothing to see here, try POST')
})

app.post('/', (req, res) => {
    console.log('access token:', spotifyApi.getAccessToken())
    if(!spotifyApi.getAccessToken()) {
        const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
        https.get(authorizeURL)
    }
    spotifyApi.getMyCurrentPlaybackState()
        .then(({body: {item: track}}) => {
            res.json(slackAttachmentResponse(track))
        })
        .catch(reason => {
            res.json(reason)
        })

})

function slackAttachmentResponse({name: trackTitle, external_urls, album, artists}) {
    const title = `${trackTitle} by ${artists[0].name}`
    return {
        username: 'Spotify App',
        attachments: [{
            fallback: title,
            title,
            title_link: external_urls.spotify,
            image_url: album.images[0].url,
            color: '#84bd00'
        }]
    }
}

app.listen(port, () => {
    console.log(`Magic happens on port: ${port}`)
})
