const Token = require('../models/token')

function tokenService(spotifyApi) {
    function refreshToken() {
        return Token.findById(process.env.token_id || 1)
            .then(doc => {
                if(!doc.refresh_token) {
                    throw new Error(`No access token found :( Try GET /auth`)  
                }
                spotifyApi.setRefreshToken(doc.refresh_token)
                return spotifyApi.refreshAccessToken()
            })
            .then(({body}) => spotifyApi.setAccessToken(body['access_token']))
    }

    function saveRefreshToken(token) {
        const tokenDoc = {refresh_token: token}
        const query = { _id: process.env.token_id || 1 }
        const options = { upsert: true, new: true }
        return Token.findOneAndUpdate(query, tokenDoc, options)
    }
    
    return {
        refreshToken,
        saveRefreshToken
    }
}

module.exports = tokenService