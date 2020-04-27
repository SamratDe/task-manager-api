const mongoose = require('mongoose')
const validator = require('validator')
//for hashing the password
const bcrypt = require('bcryptjs')
//for generating json web token
const jwt = require('jsonwebtoken')
const Task = require('./tasks')

//doing this way to take advantage of middleware
const userSchema = new mongoose.Schema({
    //structure of the model
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value))
                throw new Error('Email is invalid!!')
        }
    },
    password: {
        type: 'String',
        required: true,
        minlength: 7,
        trim: true,
        validate(value){
            if(value.toLowerCase().includes('password'))
                throw new Error('Password cannot contain the word password!')
        }
    },
    age: {
        type: Number,
        default: 18,
        validate(value){
            if(value<=0)
                throw new Error('Age must be a positive number!!')
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

//creates virtual relationship between Users and Tasks for mongoose to understand
userSchema.virtual('userTasks', {
    ref: 'Tasks',
    localField: '_id',
    foreignField: 'owner'
})

//adds an method to the documents constructed from the model -> called instance methods
userSchema.methods.generateAuthToken = async function(){
    //getting access to that specific user 
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

//this is called whenever the object gets stringified.. We have to keep the name of function
// 'toJSON' otherwise it will not work
userSchema.methods.toJSON = function(){
    const user = this
    const userObj = user.toObject()
    delete userObj.tokens
    delete userObj.password
    delete userObj.avatar
    return userObj
}

//this function is defined in the statics so we can use it wherever we want
//this static methods are accessible on the model -> called model methods
userSchema.statics.findByCredentials = async (email, password) => {
    //finding the user by email field
    const user = await personData.findOne({ email })
    if(!user)
        throw new Error('Unable to login')
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch)
        throw new Error('Unable to login')
    return user
}

//hash the plain text password before saving
userSchema.pre('save', async function(next){
    //not using arrow function because arrow function don't support the 'this' function
    const ob = this
    if(ob.isModified('password')){
        ob.password = await bcrypt.hash(ob.password, 8)
    }
    next()
})

//remove all the tasks under user when that particular user is removed
userSchema.pre('remove', async function(next){
    const ob = this
    await Task.deleteMany({ owner: ob._id })
    next()
})

//creating a model
const personData = mongoose.model('Users', userSchema)

//exporting the model
module.exports = personData