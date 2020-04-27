const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
//importing the user model
const User = require('../models/users')
//importing middleware function
const auth = require('../middleware/auth')

//creating an object of the router
const router = new express.Router()

//creates instance of multer that provides methods for generating middleware that process files
//uploaded in form-data format
const upload = multer({
    limits: {
        fileSize: 2000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
            cb(new Error('Please Upload an image file'))
        cb(undefined, true)
    }
})

router.post('/users/signup', async (req, res) => {
    const ob = new User(req.body)
    try {
        await ob.save()
        const token = await ob.generateAuthToken()
        res.status(201).send({ob, token})
    } catch(e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const ob = await User.findByCredentials(req.body.email, req.body.password)
        const token = await ob.generateAuthToken()
        res.send({ob, token})
    } catch (e) {
        res.status(400).send({error: 'Failed to log in!'})
    }
})

router.post('/users/me/avatar', auth, upload.single('pic'), async (req, res) => {
    const profilePic = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()
    req.user.avatar = profilePic
    await req.user.save()
    res.send()
}, (error, req, res, next) => { //handling express errors
    res.status(400).send( {error: error.message} )
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAllSessions', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    //const ob = await User.find({})
    res.send(req.user)
})

// router.get('/users/:id', async (req, res) => {})

router.get('/users/:id/avatar', async (req, res) => {
    try{
        const ob = await User.findById(req.params.id)
        if(!ob || !ob.avatar)
            throw new Error()
        res.set('Content-Type', 'image/png')
        res.send(ob.avatar)
    } catch(e) {
        res.status(400).send()
    }
})

router.patch('/users/me', auth,  async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'age', 'password']
    const isValidOperation = updates.every((ele) => allowedUpdates.includes(ele))
    if(!isValidOperation)
        return res.status(400).send({error: 'Invalid updates!!'})
    try {
        // const ob = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})    
        // const ob = await User.findById(req.params.id)
        updates.forEach((ele) => {
            req.user[ele] = req.body[ele]
        })
        await req.user.save()
        return res.status(201).send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const ob = await User.findByIdAndDelete(req.params.id)
        await req.user.remove()
        res.status(201).send(req.user)
    } catch(e) {
        res.status(500).send(e)
    } 
})

router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined
    req.user.save()
    res.status(200).send()
})

module.exports = router