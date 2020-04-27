/*  Run this on terminal to start mongodb
    /home/samrat/mongodb/bin/mongod --dbpath=/home/samrat/mongodb-data
*/
const mongoose = require('mongoose')
const url = process.env.MONGODB_URL

//connect to the DB
mongoose.connect(url, {
    useUnifiedTopology: true,
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false
})
