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

const path = __dirname + '/dist/'

app.use(express.static(path));

app.get('/', async(req, res) => {
    res.sendFile(path + "index.html")
})

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
    let defaultUserCount = 0
    let currentHour = 18

    function getHour() {
        let d = new Date();
        currentHour = d.getHours();
    }
    
    getHour()

    setInterval(() => {
        getHour()
    }, 100000)

    const userCounts = [
        268, 254, 125, 45, 34, 17, 12, 26,
        56, 87, 125, 147, 216, 246, 215, 220,
        266, 284, 312, 352, 321, 275, 234, 254
    ]

    const changeUserCount = () => {
        defaultUserCount = Math.floor(userCounts[currentHour] + Math.random() * 10)
        sendUserCount()
    }

    changeUserCount()

    setInterval(() => {
        changeUserCount()
    }, 10000)

    socket.join('main')

    function sendUserCount() {
        socket.emit('get user count', { userCount: io.engine.clientsCount  + defaultUserCount})
        socket.to('main').emit('get user count', { userCount: io.engine.clientsCount + defaultUserCount })
    }

    sendUserCount()

    socket.on('disconnect', function() {
        sendUserCount()
    })
})