const mongoose = require('mongoose')

//doing this way to take advantage of middleware
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        trim: true,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    }
}, {
    timestamps: true
})

const taskData = mongoose.model('Tasks', taskSchema)

module.exports = taskData