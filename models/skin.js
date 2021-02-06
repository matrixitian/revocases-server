const mongoose = require('mongoose')

const skinSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true
  },
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
  caseName: {
    type: String,
    maxlength: 20,
    required: true
  },
  tradeRequestedAt: {
    type: Number,
    required: false
  },
  requestedTrade: {
    type: Boolean,
    default: false
  },
  tradeOfferSent: {
    type: Boolean,
    default: false
  }
})

const Skin = mongoose.model('Skin', skinSchema)

module.exports = Skin