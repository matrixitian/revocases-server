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
    'allowedHeaders': ['sessionId', 'Content-Type'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}))

app.use(express.json())

app.use(serverLogic)

// try {
//     setTimeout(async () => {
//         const data = await axios.get('http://steamcommunity.com/market/priceoverview/?currency=3&appid=730&market_hash_name=StatTrak%E2%84%A2%20P250%20%7C%20Steel%20Disruption%20%28Factory%20New%29')
//         console.log(data.data)
//     }, 5000)
// } catch(err) {
//     console.log(err)
// }


app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})