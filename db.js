require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://tradeadminrevo:3crbSYmzvH876P17@revocase.wehoa.mongodb.net/revo?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true 
})