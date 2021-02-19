const mongoose = require('mongoose')

const passwordResetSchema = new mongoose.Schema({
  forEmail: {
    type: String,
    required: true
  },
  safeCode: {
    type: String,
    required: true
  },
  expired: {
    type: Boolean,
    default: false
  }
})

const passwordReset = mongoose.model('passwordReset', passwordResetSchema)

module.exports = passwordReset