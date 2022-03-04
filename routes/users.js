const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const verifyJWT = require('../middleware/verify')
const bcrypt = require('bcryptjs')

const User = require('../models/user.model')


// method   POST /users/signup
// desc     create a new user
// access   public
router.post('/signup', (req, res) => {
    const { username, email, password } = req.body

    User.findOne({ email })
        .then(user => {
            if (user === null) {
                bcrypt.hash(password, 10, (err, hash) => {
                    const password = hash
                    const newUser = new User({
                        username,
                        email,
                        password
                    })
                    newUser.save()
                        .then(user => {
                            const token = jwt.sign(
                                { id: user.id },
                                process.env.SECRET_JWT_KEY,
                                { expiresIn: 3600 }
                            )
                            res.json({
                                token: token,
                                userId: user.id,
                                username: user.username,
                                admin: user.admin
                            })
                        })
                        .catch(err => res.status(400).json(err))
                })     
            } else {
                res.status(400).json({ userExists: true })
            }
        })
        .catch(err => res.status(400).json(err))
}) 

// method   POST /users/login
// desc     user login
// access   public
router.post('/login', (req, res) => {
    const { email, password } = req.body

    User.findOne({ email })
        .then(user => {
            if (user !== null) {
                bcrypt.compare(password, user.password, (err, response) => {
                    if (response === true) {
                        const token = jwt.sign(
                            { id: user.id },
                            process.env.SECRET_JWT_KEY,
                            { expiresIn: 3600 }
                        )
                        res.json({
                            token: token,
                            userId: user.id,
                            username: user.username,
                            admin: user.admin
                        })
                    } else {
                        res.status(400).json({ invalidCredentials: true })
                    }
                })
                
            } else {
                res.status(400).json({ userNotExist: true })
            }
        })
        .catch(err => res.status(400).json(err))
})

// method   Get /users/username/:id
// desc     get authorname of post
// access   public
router.get('/username/:id', (req, res) => {
    const userId = req.params.id

    User.findById(userId)
        .then(user => res.json({ author: `${user.username}` }))
        .catch(err => res.status(400).json(err))
})

// method   GET /users/loggedin
// desc     check if a user is logged in
// access   public
router.get('/loggedin', (req, res) => {
    const token = req.header('x-access-token')

    if (!token) {
        res.status(401).json({ loggedIn: false })
    } else {
        jwt.verify(token, process.env.SECRET_JWT_KEY, (err, decoded) => {
            if (err) {
                res.status(400).json({ loggedIn: false })
            } else {
                res.json({ loggedIn: true })
            }
        })
    }
})

// method   GET /users/likedposts/:userId/:blogPostId
// desc     checks if the user liked the current blogPost
// access   public
router.get('/likedposts/:userId/:blogPostId', (req, res) => {
    userId = req.params.userId
    blogPostId = req.params.blogPostId

    User.findById(userId)
        .then(user => {
            const likedPosts = user.likedPosts

            if (likedPosts.indexOf(blogPostId) >= 0) {
                res.json({ likedPost: true })
            } else {
                res.json({ likedPost: false })
            }
        })
        .catch(err => res.status(400).json(err))
})

// ----------------------------------------------------------------------------
// method   POST /users/addlike/:userId/:blogPostId
// desc     adds a post id to likedPosts array
// access   public
router.post('/addlike/:userId/:blogPostId', verifyJWT, (req, res) => {
    userId = req.params.userId
    blogPostId = req.params.blogPostId

    User.findById(userId)
        .then(user => {
            user.likedPosts.push(blogPostId)
            user.save()
                .then(() => {
                    res.json('good')
                })
                .catch(err => res.status(400).json(err))

        })
        .catch(err => res.status(400).json(err))
})

// ----------------------------------------------------------------------------
// method   PUT /users/removelike/:userId/:blogPostId
// desc     removes a post id from likedPosts array
// access   public
router.put('/removelike/:userId/:blogPostId', verifyJWT, (req, res) => {
    const userId = req.params.userId
    const blogPostId = req.params.blogPostId

    User.findById(userId)
        .then(user => {
            const likedPosts = user.likedPosts
            const index = likedPosts.indexOf(blogPostId)
            likedPosts.splice(index, 1)
            user.save()
                .then(() => res.json('good'))
                .catch(err => res.status(400).json(err))
        })
        .catch(err => res.status(400).json(err))
})

// ----------------------------------------------------------------------------
// method   PUT /users/deletedpost/removelike/:id
// desc     removes the blogpost id from user likedpost array when the post is deleted
// access   public
router.put('/deletedpost/removelike/:id', verifyJWT, (req, res) => {
    const blogPostId = req.params.id

    User.find({ blogPostId })
        .then(users => {
            users.forEach(user => {
                const likedPosts = user.likedPosts
                const index = likedPosts.indexOf(blogPostId)
                likedPosts.splice(index, 1)
                user.save()
            })
            res.json('good')
        })
        .catch(err => res.status(400).json(err))
})

// method   GET /users/account
// desc     get a single user for the account
// access   private
router.get('/account', verifyJWT, (req, res) => {
    const userId = req.userId

    User.findById(userId)
        .then(user => res.json(user))
        .catch(err => res.status(400).json(err))
})

// method   PUT /users/update/username
// desc     updates the username of an account
// access   private
router.put('/update/username', verifyJWT, (req, res) => {
    const userId = req.userId
    const { username } = req.body

    User.findById(userId)
        .then(user => {
            user.username = username
            user.save()
            res.json('success')
        })
        .catch(err => res.status(400).json(err))
})

// method   PUT /users/update/all
// desc     updates the username and password
// access   private
router.put('/update/all', verifyJWT, (req, res) => {
    const userId = req.userId
    const { username, oldPassword, newPassword } = req.body

    User.findById(userId)
        .then(user => {
            bcrypt.compare(oldPassword, user.password, (err, response) => {
                if (response === true) {
                    bcrypt.hash(newPassword, 10, (err, hash) => {
                        const password = hash
                        user.username = username
                        user.password = password
                        user.save()
                        res.json({ success: true })
                    })
                } else {
                    res.json({ wrongOldPassword: true })
                }
            })
        })
        .catch(err => res.status(400).json(err))
})

// method   GET /users/:userid
// desc     get a single user
// access   public
router.get('/:id', (req, res) => {
    const userId = req.params.id

    User.findById(userId)
        .then(user => res.json(user))
        .catch(err => res.status(400).json(err))
})


module.exports = router
