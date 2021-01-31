const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    uid: {
      type: String,
      required: true
    },
    adsOpened: {
      type: Number,
      default: 0
    },
    credits: {
      type: Number,
      default: 0
    },
    skins: [{ // references
      type: String,
      required: false
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