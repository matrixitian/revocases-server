const mongoose = require('mongoose')

const skinSchema = new mongoose.Schema({
  skin: {
    type: String,
    required: true
  },
  grade: {
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
  requestedTrade: {
    type: Boolean,
    default: false
  }
})

const Skin = mongoose.model('Skin', skinSchema)

module.exports = Skin