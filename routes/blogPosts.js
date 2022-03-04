const express = require('express')
const verifyJWT = require('../middleware/verify')
const multer = require('multer')
const { uploadFile, downloadFile, deleteFile } = require('../config/s3')
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const router = express.Router()

const BlogPost = require('../models/blogPost.model')


// multer setup
// create the storage directory
const upload = multer({ dest: './uploads/' })

// method   POST /blogposts/create
// desc     route with multer middleware to upload file to s3 bucket
// access   private
router.post('/create', verifyJWT, upload.single('file'), async (req, res) => {
    console.log(req.body)
    console.log(req.file)
    const file = req.file
    const result = await uploadFile(file)
    await unlinkFile(file.path)
    console.log(result.Key)

    const { title, description, body } = req.body
    const imageKey = result.Key
    const userId = req.userId
    const newBlogPost = new BlogPost({
        title,
        description,
        body,
        imageKey,
        userId
    })
    newBlogPost.save()
        .then(blogPost => res.json(blogPost._id))
        .catch(err => res.status(400).json(err))    
})

// method   GET /blogposts
// desc     get all blogposts
// access   public
router.get('/', (req, res) => {
    BlogPost.find()
        .then(blogPosts => res.json(blogPosts))
        .catch(err => res.status(400).json(err))
})

// method   GET /blogposts/image/:id
// desc     get the image from a single blogpost
// access   public
router.get('/image/:id', (req, res) => {
    const blogPostId = req.params.id

    BlogPost.findById(blogPostId)
        .then(blogPost => {
            const imageKey = blogPost.imageKey
            const readStream = downloadFile(imageKey)

            readStream.pipe(res)
        })
        .catch(err => res.status(400).json(err))
})

// method   GET /blogposts/info/:id
// desc     get the info from a single blogpost
// access   public
router.get('/info/:id', (req, res) => {
    const blogPostId = req.params.id

    BlogPost.findById(blogPostId)
        .then(blogPost => res.json(blogPost))
        .catch(err => res.status(400).json(err))
})

// ----------------------------------------------------------------------------
// method   GET /blogposts/addlike/:id
// desc     add a like to a post
// access   private
router.post('/addlike/:id', verifyJWT, (req, res) => {
    const blogPostId = req.params.id

    BlogPost.findById(blogPostId)
        .then(blogPost => {
            blogPost.likeCount += 1
            blogPost.save()
                .then(res.json({ likeCount: `${blogPost.likeCount}` }))
                .catch(err => res.status(400).json(err))
        })
        .catch(err => res.status(400).json(err))
})

// ----------------------------------------------------------------------------
// method   PUT /blogposts/removelike/:id
// desc     remove a like from a post
// access   public
router.put('/removelike/:id', verifyJWT, (req, res) => {
    const blogPostId = req.params.id

    BlogPost.findById(blogPostId)
        .then(blogPost => {
            blogPost.likeCount -= 1
            blogPost.save()
                .then(res.json({ likeCount: `${blogPost.likeCount}` }))
                .catch(err => res.status(400).json(err))
        })
        .catch(err => res.status(400).json(err))
})

// method   PUT /blogposts/edit/nopic/:id
// desc     edit a post without a new picture
// access   private
router.put('/edit/nopic/:id', verifyJWT, (req, res) => {
    const userId = req.userId
    const blogPostId = req.params.id

    const { title, description, body } = req.body

    BlogPost.findById(blogPostId)
        .then(blogPost => {
            if (userId === blogPost.userId) {
                blogPost.title = title
                blogPost.description = description
                blogPost.body = body
                blogPost.save()
                res.json('post edited')
            } else {
                res.status(401).json('unauthorized')
            }
        })
        .catch(err => res.status(400).json(err))
})

// method   PUT /blogposts/edit/yespic/:id
// desc     edit a post with a new picture
// access   private
router.put('/edit/yespic/:id', verifyJWT, upload.single('file'), async (req, res) => {
    const file = req.file
    const result = await uploadFile(file)
    await unlinkFile(file.path)

    const userId = req.userId
    const blogPostId = req.params.id
    const imageKey = result.Key
    const { title, description, body } = req.body

    BlogPost.findById(blogPostId)
        .then(blogPost => {
            if (userId === blogPost.userId) {
                blogPost.title = title
                blogPost.description = description
                blogPost.body = body
                deleteFile(blogPost.imageKey)
                blogPost.imageKey = imageKey
                blogPost.save()
                res.json('post edited')
            } else {
                res.status(401).json('unauthorized')
            }
        })
        .catch(err => res.status(400).json(err))
})

// method   GET /blogposts/latest/
// desc     get the latest 7 blogposts
// access   public
router.get('/latest', (req, res) => {
    BlogPost.find()
        .then(blogPosts => {
            res.json(blogPosts.slice(-7))
        })
        .catch(err => res.status(400).json(err))
})

// method   DELETE /blogposts/delete/:id
// desc     delete a single blogpost
// access   private
router.delete('/delete/:id', verifyJWT, (req, res) => {
    const userId = req.userId
    const blogPostId = req.params.id

    BlogPost.findById(blogPostId)
        .then(blogPost => {
            if (blogPost.userId === userId) {
                deleteFile(blogPost.imageKey)
                BlogPost.findByIdAndDelete(blogPostId)
                    .then(blogPost => res.json(blogPost))
                    .catch(err => res.status(400).json(err))
            } else {
                res.status(400).json('unauthorized')
            }
        })
        .catch(err => res.status(400).json(err))
})

// method   GET /blogposts/myposts
// desc     get all of a user's posts
// access   private
router.get('/myposts', verifyJWT, (req, res) => {
    const userId = req.userId

    BlogPost.find({ userId })
        .then(blogPosts => {
            res.json(blogPosts)
        })
        .catch(err => res.status(400).json(err))
})


module.exports = router
