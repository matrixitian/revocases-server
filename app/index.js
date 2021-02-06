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
    socket.join('main')

    function sendUserCount() {
        socket.emit('get user count', { userCount: io.engine.clientsCount  + 112})
        socket.to('main').emit('get user count', { userCount: io.engine.clientsCount + 112 })
    }

    sendUserCount()

    socket.on('disconnect', function() {
        sendUserCount()
    })
})