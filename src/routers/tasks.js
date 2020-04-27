const express = require('express')
const auth = require('../middleware/auth')
const Task = require('../models/tasks')

const router = new express.Router()

router.post('/tasks/create', auth, async (req, res) => {
    const ob = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await ob.save()
        res.status(201).send(ob)
    } catch(e) {
        res.status(400).send(e)
    }
})

// tasks/showall?completed=true
// tasks/showall?limit=10&skip=20
// tasks/showall?sortBy=createdAt_desc
router.get('/tasks/showall', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if(req.query.completed)
        match.completed = req.query.completed === 'true'
    if(req.query.sortBy){
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc'?-1:1
    }
    try {
        //customizing the populate function to find specific results
        await req.user.populate({
            path: 'userTasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.userTasks)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const ob = await Task.findOne( {_id, owner: req.user._id} )
        if(!ob)
            return res.status(400).send()
        res.send(ob)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['completed', 'description']
    const isValidOperation = updates.every((ele) => allowedUpdates.includes(ele))
    if(!isValidOperation)
        return res.status(400).send({error: 'Invalid updates!!'})
    try {
        const ob = await Task.findOne({_id: req.params.id, owner: req.user._id} )
        if(!ob)
            return res.status(404).send()
        updates.forEach((ele) => {
            ob[ele] = req.body[ele]
        })
        await ob.save()
        return res.status(201).send(ob)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const ob = await Task.findOne( {_id: req.params.id, owner: req.user._id} )
        if(!ob)
            res.status(404).send()
        await ob.remove()
        res.status(200).send(ob)
    } catch(e) {
        res.status(500).send(e)
    } 
})

module.exports = router