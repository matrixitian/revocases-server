const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const log = console.log

router.post('/buy-case', async(req, res) => {
  console.log(req.body)

  res.send("Received!")
})

router.get('/trade-requests', async(req, res) => {
  const user = await User.findById({_id: req.user._id})

  return res.send(req.user)
})

router.post('/tag', async(req, res) => {
  const tag = req.body.tag.toLowerCase()

  try {
      const user = await User.findById({_id: req.user._id})
      user.tags.push(tag)
      await user.save()

      res.sendStatus(200)
  } catch (err) {
      res.sendStatus(400)
  }
})

module.exports = router