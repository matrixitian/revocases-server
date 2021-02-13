const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    adsViewed: {
      type: Number,
      default: 0
    },
    // Referral Points
    rp: { 
      type: Number,
      default: 0
    },
    credits: {
      type: Number,
      default: 0
    },
    tradeURL: {
      type: String,
      required: true
    },
    skins: [{ // references
      type: String,
      required: false
    }],
    blues: {
      type: Number,
      default: 0
    },
    purples: {
      type: Number,
      default: 0
    },
    pinks: {
      type: Number,
      default: 0
    },
    reds: {
      type: Number,
      default: 0
    },
    yellows: {
      type: Number,
      default: 0
    },
    casesOpened: {
      type: Number,
      default: 0
    },
    password: {
      type: String,
      minlength: 7,
      trim: true,
      required: true
    },
    referredTo: {
      type: String,
      default: null
    },
    boosterAdsFinishedAt: {
      type: Date,
      required: false
    },
    tokens: [{
      token: {
        type: String,
        required: true
      }
    }]
})

userSchema.methods.toJSON = function() {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens

  return userObject
}

userSchema.methods.generateAuthToken = async function() {
  const user = this
  const token = jwt.sign({ _id: user._id.toString()}, process.env.SECRET)
  user.tokens = user.tokens.concat({ token })

  await user.save()
  return token
}

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email })

  let isMatch
  if (!user) { 
    throw new Error('Wrong e-mail or password.')
  } else {
    isMatch = await bcrypt.compare(password, user.password)
  }

  if (!isMatch) throw new Error('Wrong e-mail or password')

  return user
}

userSchema.pre('save', async function(next) {
  const user = this

  if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, 8)
  }
  
  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User