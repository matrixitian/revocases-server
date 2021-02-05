require('dotenv').config()
require('./db.js')
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const app = express();

const serverLogic = require('./router/serverLogic')

const port = process.env.PORT || 3000

// Enables CORS
app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type', 'Authorization'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}))

app.use(express.json())

app.use(serverLogic)

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})

// Sockets
const io = require('socket.io')(server, {
    cors: {
        origin: '*'
    }
})

io.on('connection', function(socket) {
    // console.log(socket.id)
    console.log("Socket connected.")

    let userCount = 27

    socket.on('enter server', function(room) {
        socket.join(room)
        userCount++
        console.log(userCount)

        socket.broadcast.to(room).emit('get user count', {
            userCount: userCount
        })
    })
    
    socket.on('enter server', function(data) {
        userCount++
        socket.broadcast.to(data.room).emit('get user count', {
            userCount: userCount
        })
    })

    socket.on('leave server', function(data) {
        userCount--
    })
})