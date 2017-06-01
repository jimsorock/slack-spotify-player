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
            res.json({
                status: 'success'
            })
        })
        .catch(reason => {
            res.json({
                status: 'failed to authorize'
            })
            console.log('Something went wrong!', reason)
        })
})

app.get('/', () => {
    res.send('nothing to see here, trying POST')
})

app.post('/', (req, res) => {
    if(!spotifyApi.getAccessToken()) {
        return res.json({
            text:`No access token found :(`
        })
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
        username: 'Crowdrise\'s Spotify Bot',
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