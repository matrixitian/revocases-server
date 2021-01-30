const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    gID: { // firebase user id
      type: String,
      trim: true,
      required: true
    },
    credits: {
      type: Number,
      default: 0
    },
    startTokensReceived: {
      type: Boolean,
      default: false
    },
    skins: [{ // references
      type: String,
      required: true
    }]
})

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

const User = mongoose.model('User', userSchema)

module.exports = User