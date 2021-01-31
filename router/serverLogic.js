const express = require('express')
const steamprice = require('steam-price-api');
const router = new express.Router()
const User = require('../models/user')
const Skin = require('../models/skin')
const log = console.log

router.post('/create-user', async(req, res) => {
    const userUID = req.body.userUID
    const tradeURL = req.body.tradeURL

    try {
        const userForSave = new User({
          uid: userUID,
          tradeURL
        })

        const user = await userForSave.save()

        return res.status(201).send({ user })
    } catch(err) {
      log(err)
      return res.status(500).send(err)
    }
})

const getWeapon = (caseName) => {
  const wpnCases = {
    dangerZone: {
      mil_spec: [
        'nova_wood_fired',
        'sawed-off_black_sand',
        'sg553_danger_close',
        'mp9_modest_threat',
        'tec-9_fubar',
        'glock-18_oxide_blaze',
        'm4a4_magnesium'
      ],
      restricted: [
        'g3sg1_scavenger',
        'mac-10_pipe_down',
        'galil_ar_signal',
        'p250_nevermore',
        'usp-s_flashback',
        'ump-45_momentum'
      ],
      classified: [
        'mp5-sd_phosphor',
        'ump-45_momentum',
        'desert_eagle_mecha_industries'
      ],
      covert: [
        'awp_neo-noir',
        'ak-47_asiimov'
      ]
    },
    phoenix: {
      mil_spec: [
        'ump-45_corporal',
        'mag-7_heaven_guard',
        'negev_terrain',
        'tec-9_sandstorm'
      ],
      restricted: [
        'famas_sergeant',
        'mac-10_heat',
        'sg_553_pulse',
        'usp-s_guardian',
      ],
      classified: [
        'p90_trigon',
        'nova_antique',
        'dak-47_redline',
      ],
      covert: [
        'aug_chameleon',
        'awp_asiimov'
      ]
    },
    chroma2: {
      mil_spec: [
        "negev_man-o-'war",
        'sawed-off_origami',
        'mp7_armor_core',
        'p250_valence',
        'desert_eagle_bronze_deco',
        'ak-47_elite_build'
      ],
      restricted: [
        'ump-45_grand_prix',
        'cz75-auto_pole_position',
        'mag-7_heat',
        'awp_worm_god',
      ],
      classified: [
        'famas_djinn',
        'five-seven_monkey_business',
        'galil_ar_eco',
      ],
      covert: [
        'mac-10_neon_rider',
        'm4a1-s_hyper_beast'
      ]
    },
    fracture: {
      mil_spec: [
        'negev_ultralight',
        "sg_553_ol'rusty",
        'p2000_gnarled',
        'p90_freight',
        'pp-bizon_runic',
        'p250_cassette',
        'ssg_08_mainframe_001'
      ],
      restricted: [
        'galil_ar_connexion',
        'mp5-sd_kitbash',
        'tec-9_brother',
        'mac-10_allure',
        'mag-7_monster_call'
      ],
      classified: [
        'xm1014_entombed',
        'glock-18_vogue',
        'm4a4_toothfairy',
      ],
      covert: [
        'ak-47_legion_of_anubis',
        'desert_eagle_printstream'
      ]
    },
    clutch: {
      mil_spec: [
        'xm1014_oxide_blaze',
        'pp-bizon_night_riot',
        'p2000_urban_hazard',
        'five-seven_flame_test',
        'g_553_aloha',
        'r8_revolver_grip',
        'mp9_black_sand'
      ],
      restricted: [
        'negev_lionfish',
        'nova_wild_six',
        'ump-45_artic_wolf',
        'mag-7_swag-7',
        'glock-18_moonrise'
      ],
      classified: [
        'aug_stymphalian',
        'awp_mortis',
        'usp-s_cortex',
      ],
      covert: [
        'mp7_bloodsport',
        'm4a4_neo-noir'
      ]
    }
  }

  const formattedSkinName = {
    dangerZone: {
      mil_spec: [
        'Wood Fired',
        'Black Sand',
        'Danger Close',
        'Modest Threat',
        'Fubar',
        'Oxide Blaze',
        'Magnesium'
      ],
      restricted: [
        'Scavenger',
        'Pipe Down',
        'Signal',
        'Nevermore',
        'Flashback',
      ],
      classified: [
        'Phosphor',
        'Momentum',
        'Mecha Industries'
      ],
      covert: [
        'Neo-Noir',
        'Asiimov'
      ]
    },
    phoenix: {
      mil_spec: [
        'Corporal',
        'Heaven Guard',
        'Terrain',
        'Sandstorm'
      ],
      restricted: [
        'Sergeant',
        'Heat',
        'Pulse',
        'Guardian',
      ],
      classified: [
        'Guardian',
        'Antique',
        'Redline',
      ],
      covert: [
        'Chameleon',
        'Asiimov'
      ]
    },
    chroma2: {
      mil_spec: [
        "Man-o'-war",
        'Origami',
        'Armor Core',
        'Valence',
        'Bronze Deco',
        'Elite Build'
      ],
      restricted: [
        'Grand Prix',
        'Pole Position',
        'Heat',
        'Worm God',
      ],
      classified: [
        'Djinn',
        'Monkey Business',
        'Eco',
      ],
      covert: [
        'Neon Rider',
        'Hyper Beast'
      ]
    },
    fracture: {
      mil_spec: [
        'Ultralight',
        "Ol' Rusty",
        'Gnarled',
        'Freight',
        'Runic',
        'Cassette',
        'Mainframe 001'
      ],
      restricted: [
        'Connexion',
        'Kitbash',
        'Brother',
        'Allure',
        'Monster Call'
      ],
      classified: [
        'Entombed',
        'Vogue',
        'Tooth Fairy',
      ],
      covert: [
        'Legion of Anubis',
        'Printstream'
      ]
    },
    clutch: {
      mil_spec: [
        'Oxide Blaze',
        'Night Riot',
        'Urban Hazard',
        'Flame Test',
        'Aloha',
        'Grip',
        'Black Sand'
      ],
      restricted: [
        'Lionfish',
        'Wild Six',
        'Arctic Wolf',
        'SWAG-7',
        'Moonrise'
      ],
      classified: [
        'Stymphalian',
        'Mortis',
        'Cortex',
      ],
      covert: [
        'Bloodsport',
        'Neo-Noir'
      ]
    }
  }

  let skinGrade
  let skinCon

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
    skinCon = 'bs'
  }
  // For Classified
  else if (skinGrade === 'classified') {
    const num = Math.round(skinCon * 100) / 100

    if (num < 15) {
      skinCon = 'ww'
    } else {
      skinCon = 'bs'
    }
  }
  // For below Classified shuffle condition normally
  else {
    // Get Skin condition
    skinCon = Math.random() * 100
    skinCon = Math.round(skinCon * 100) / 100

    const getCondition = () => {
      if (skinCon <= 3) return 'fn'
      else if (skinCon >= 3 && skinCon < 10) return 'mw'
      else if (skinCon >= 10 && skinCon < 35) return 'ft'
      else if (skinCon >= 35 && skinCon < 70) return 'ww'
      else if (skinCon >= 70) return 'bs'
    }

    skinCon = getCondition()
  }

  const arrLen = wpnCases[caseName][skinGrade].length
  const skinIndex = Math.floor(Math.random() * (arrLen - 0) + 0)

  const skin = wpnCases[caseName][skinGrade][skinIndex]
  const formattedSkin = formattedSkinName[caseName][skinGrade][skinIndex]

  return { formattedSkin, skin, skinGrade, skinCon }
}

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

  const user = await User.findOne({ uid: userUID }, `credits tradeURL -_id`)
  const userCredits = user.credits
  const creditsRequired = casePrices[caseIndex]

  let skinGrade
  let skinCon

  let skin
  let formattedSkin
  if (userCredits >= creditsRequired) {
    const data = getWeapon(caseName)
    skinGrade = data.skinGrade
    skinCon = data.skinCon
    skin = data.skin
    formattedSkin = data.formattedSkin

    try {
      await User.updateOne({ uid: userUID }, {
        credits: userCredits - creditsRequired
      })

      const saveSkin = new Skin({
        skin,
        grade: skinGrade,
        condition: skinCon,
        uid: userUID
      })

      saveSkin.save()

      // Save Skin reference to User
      const userSaveSkinRef = await User.findOne({ uid: userUID })
      userSaveSkinRef.skins.push(saveSkin._id)
      await userSaveSkinRef.save()
    } catch(err) {
      log(err)
    }
  } else {
    return res.status(400).send("Not enough moneros Sunny. And cheating ain't nice")
  }

  res.status(200).send({ skin: formattedSkin, skinLonghand: skin, skinGrade, skinCon })
})

router.get('/check-profitability', async(req, res) => {
  console.log('hello')
//   const key = req.body.key // secret key

//   let i

//   let skins = []
//   for (i = 0; i < 1000; i++) {
//     let data = getWeapon()
//     skin = data.skin
//     skinCon = data.skinCon

//     const shorthandCondition = ['fn', 'mw', 'ft', 'ww', 'bs']
//     const conditions = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred']
    
//     const conIndex = this.shorthandCondition.indexOf(skinCon)
//     skinCon = conditions[conIndex]

//     let formattedSkin = skin.replace('_', ' ')
//     formattedSkin = `${formattedSkin} `

//     // skins.push(`${}`)
//   }
  

//   const items = [
//     'Clutch Case Key',
//     'Clutch Case'
// ]

try {
  const price = await steamprice.getprices(730, 'Glock-18 | Neo-Noir (Minimal Wear)', '1')
} catch(err) {
  return res.status(400).send(err)
}

res.status(200).send(price)
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