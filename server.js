// imports and vars
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require("dotenv").config()

const app = express()
const port = process.env.PORT


// middleware
app.use(cors())
app.use(express.json())


// database config
const uri = process.env.URI
mongoose.connect(uri)
    .then(() => {
        app.listen(port, () => {
            console.log(`server running on port ${port}`)
            console.log('database connection established')
        })
    })
    .catch(() => console.log('error occured when starting the server'))


// routes
const usersRouter = require('./routes/users')
app.use('/users', usersRouter)

const blogPostsRouter = require('./routes/blogPosts')
app.use('/blogposts', blogPostsRouter)
