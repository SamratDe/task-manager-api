const express = require('express')

const app = express()

const port = process.env.PORT

//so that mongoose is connected to the database 
require('./db/mongoose')

//user and task routes
const UserRoutes = require('./routers/users')
const TaskRoutes = require('./routers/tasks')

app.use(express.json())
app.use(UserRoutes)
app.use(TaskRoutes)

app.listen(port, () => {
    console.log('Server started running at '+ port)
})
