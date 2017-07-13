const mongoose = require('mongoose')

const tokenSchema = mongoose.Schema({
    _id: Number,
    refresh_token: String
})

module.exports =  mongoose.model('Token', tokenSchema)