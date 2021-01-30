const mongoose = require('mongoose')

const skinSchema = new mongoose.Schema({
  uname: {
    type: String,
    required: true
  },
  skinName: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    maxlength: 2,
    required: true
  },
  tradeURL: {
    type: String,
    required: true
  },
  openedAt: {
    type: Number,
    required: true
  },
  requestedTrade: false
})

const Skin = mongoose.model('Skin', skinSchema)

module.exports = Skin