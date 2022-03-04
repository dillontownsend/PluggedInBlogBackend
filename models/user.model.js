const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Boolean,
        required: true,
        default: false
    },
    likedPosts: {
        type: [String],
        required: true
    }
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

module.exports = User