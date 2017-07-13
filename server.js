const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 8080
const SpotifyWebApi = require('spotify-web-api-node')
const mongoose = require('mongoose')

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID || 'foo',
    clientSecret: process.env.CLIENT_SECRET || 'bar',
    redirectUri: process.env.REDIRECT_URI || 'google.com'
});
const tokenService = require('./app/services/tokenService')(spotifyApi)

mongoose.Promise = global.Promise;
const connection = mongoose.connect(process.env.DB_URL,  { useMongoClient: true })

const scopes = ['user-read-playback-state', 'user-read-recently-played'],
    state = 'slack-spotify'

app.get('/auth', (req, res) => {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
    res.redirect(authorizeURL)
})

app.use('/auth-callback', (req, res) => {
    spotifyApi.authorizationCodeGrant(req.query.code)
        .then(({body}) => {
            spotifyApi.setAccessToken(body['access_token']);
            spotifyApi.setRefreshToken(body['refresh_token']);

            tokenService.saveRefreshToken(body['refresh_token'])
                .then(({refresh_token}) => res.json({
                        status: 'success',
                        token: refresh_token
                    })
                )
        })
        .catch(reason => {
            res.json({
                status: 'failed to authorize'
            })
            console.log('Something went wrong!', reason)
        })
})



app.get('/', (req, res) => res.send('Nothing to see here, try POST'))

app.post('/', (req, res) => {
    if(!spotifyApi.getAccessToken()) {
        tokenService.refreshToken().then(() => {
            spotifyApi.getMyCurrentPlaybackState()
                .then(({body: {item: track, timestamp}}) => res.json(
                    slackAttachmentResponse([createSlackAttachment(track, timestamp)]))
                )
                .catch(reason => res.json(reason.message))
        })
        .catch(reason => res.json(reason))
    } else {
        spotifyApi.getMyCurrentPlaybackState()
            .then(({body: {item: track, timestamp}}) => res.json(
                    slackAttachmentResponse([createSlackAttachment(track, timestamp)]))
            )
            .catch(reason => res.json(reason.messsage))
    }  
})

app.post('/recent', (req, res) => {
    if(!spotifyApi.getAccessToken()) {
        tokenService.refreshToken().then(() => {
            spotifyApi.getMyRecentlyPlayedTracks({limit:5})
            .then(({ body: { items } }) => {
                const attachments = items.map(
                    ({track, played_at}) => createSlackAttachment(track, played_at)
                )
                res.json(slackAttachmentResponse(attachments))
            })
            .catch(reason => res.json(reason.message))
        }) 
    } else {
        spotifyApi.getMyRecentlyPlayedTracks({limit:10})
            .then(({ body: { items } }) => {
                const attachments = items.map(
                    ({track, played_at}) => createSlackAttachment(track, played_at)
                )
                res.json(slackAttachmentResponse(attachments))
            })
            .catch(reason => res.json(reason.message))
    }
})

function createSlackAttachment({name: trackTitle, external_urls, album, artists}, timestamp) {
    const title = `${trackTitle} by ${artists[0].name}`
    return {
            fallback: title,
            title,
            title_link: external_urls.spotify,
            image_url: album.images[0].url,
            color: '#84bd00',
            footer: 'Played',
            ts: Math.round(new Date(timestamp).getTime()/1000)
        }
}

function slackAttachmentResponse(attachments) {
    return {
        username: 'Spotify App',
        attachments
    }
}

app.listen(port, () => {
    console.log(`Magic happens on port: ${port}`)
})
