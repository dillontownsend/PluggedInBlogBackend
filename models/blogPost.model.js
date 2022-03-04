const mongoose = require('mongoose')
const Schema = mongoose.Schema

const blogPostSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    imageKey: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    likeCount: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true })

const BlogPost = mongoose.model('BlogPost', blogPostSchema)

module.exports = BlogPost
