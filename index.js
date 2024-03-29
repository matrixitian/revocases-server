require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const app = express({
    maxAge: 31536000
})
const compression = require('compression')

const serverLogic = require('./router/serverLogic')

const port = process.env.PORT || 3000

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true 
})

// Enables CORS
app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type', 'Authorization'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}))

app.use(express.json())

app.use(compression())

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

// User count
let defaultUserCount = 0
    let currentHour = 24

    function getHour() {
        let d = new Date();
        currentHour = d.getHours();
    }
    
    getHour()

    setInterval(() => {
        getHour()
    }, 3600000)

    const userCounts = [
        152, 125, 62, 23, 17, 8, 6, 13,
        33, 46, 67, 76, 105, 122, 105, 110,
        130, 142, 146, 176, 160, 145, 115, 106
    ]

    const changeUserCount = () => {
        defaultUserCount = Math.floor(userCounts[currentHour] + Math.random() * 10)
    }

    setInterval(() => {
        changeUserCount()
    }, 30000)

io.on('connection', function(socket) {
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