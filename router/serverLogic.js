const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const log = console.log

router.post('/create-user', async(req, res) => {
    const userUID = req.body.userUID

    try {
        const userForSave = new User({
          uid: userUID
        })

        const user = await userForSave.save()

        return res.status(201).send({ user })
    } catch(err) {
      log(err)
      return res.status(500).send(err)
    }
})

router.post('/buy-case', async(req, res) => {
  // % to get gun grade
  // mil_spec: 89.0, // blue
  // restricted: 10.8, // purple
  // classified: 0.20, // pink
  // covert: 0.00, // red
  // exceedingly_rare: 0.00 // yellow

  // % to get gun condition
  // fn: 3,
  // mw: 7,
  // ft: 40,
  // ww: 30,
  // bs: 20

  const userUID = req.body.userUID
  const caseName = req.body.caseName

  const cases = ['dangerZone', 'chroma2', 'clutch', 'fracture', 'phoenix']
  const casePrices = [350, 400, 450, 750, 1100]

  const caseIndex = cases.indexOf(caseName)

  const userCredits = await User.findById(userUID, `credits`)
  const creditsRequired = casePrices[caseIndex]

  let skinGrade
  let skinCon
  const getSkinGradeAndCondition = () => {
    // Get Skin Grade
    skinGrade = Math.random() * 100
    skinGrade = Math.round(skinGrade * 100) / 100

    const getGrade = () => {
      if (skinGrade < 0) return 'exceedingly_rare'
      else if (skinGrade >= 0 && skinGrade < 0.20) return 'classified' 
      else if (skinGrade >= 0.20 && skinGrade < 11.00) return 'restricted'
      else if (skinGrade >= 11.00) return 'mil_spec'
    }

    skinGrade = getGrade()

    // Get Skin Condition
    // For Covert
    if (skinGrade === 'covert') {
      skinCon = 'Battle-Scarred'
    }
    // For Classified
    else if (skinGrade === 'classified') {
      const num = Math.round(skinCon * 100) / 100

      if (num < 15) {
        skinCon = 'Well-Worn'
      } else {
        skinCon = 'Battle-Scarred'
      }
    }
    // For below Classified shuffle condition normally
    else {
      // Get Skin condition
      skinCon = Math.random() * 100
      skinCon = Math.round(skinCon * 100) / 100

      const getCondition = () => {
        if (skinCon <= 3) return 'Factory New'
        else if (skinCon >= 3 && skinCon < 10) return 'Minimal Wear'
        else if (skinCon >= 10 && skinCon < 50) return 'Field-Tested'
        else if (skinCon >= 50 && skinCon < 80) return 'Well-Worn'
        else if (skinCon >= 80) return 'Battle-Scarred'
      }

      skinCon = getCondition()
    }
  }

  if (userCredits >= creditsRequired) {
    getSkinGradeAndCondition()

    // const arrLen = cases[caseName][skinGrade].length

    // console.log(arrLen)
  }

  res.status(200).send({ skinGrade, skinCon })
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