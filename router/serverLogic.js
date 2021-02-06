const express = require('express')
const auth = require('../middleware/auth')
const firebase = require('firebase');
const steamprice = require('steam-price-api');
const router = new express.Router()
const moment = require('moment')
const User = require('../models/user')
const Skin = require('../models/skin')
const log = console.log

firebase.initializeApp({ 
  apiKey: "AIzaSyDMWb56THHAiz7jqRT2dyDbIq2R3ux3Mp0",
  authDomain: "revo-skins.firebaseapp.com",
  projectId: "revo-skins",
  storageBucket: "revo-skins.appspot.com",
  messagingSenderId: "850588837597",
  appId: "1:850588837597:web:ef961e5390f73558241d34",
  measurementId: "G-G43NV0CTSV"
})

require('firebase/firestore')

const firestore = firebase.firestore()

function addSkinToLiveDrops(skin) {
  firestore.collection("drops").add({
    uname: 'John',
    skin: 'Redline',
    skin_longhand: 'ak-47_redline',
    grade: 'classified',
    condition: 'fn',
    timeOpened: Number(Date.now())
  })
}

addSkinToLiveDrops({})

router.get('/', async(req, res) => {
  return res.status(200).send('Server active.')
})

router.get('/get-user', auth, async(req, res) => {
  return res.status(200).send(req.user)
})

router.post('/signup', async (req, res) => {
  const username = req.body.username
  const email = req.body.email
  const password = req.body.password
  const tradeURL = req.body.tradeURL

  try {
    let emailTaken = await User.findOne({ email })
    let usernameTaken = await User.findOne({ username })

    if (usernameTaken) {
      console.log('hi')

      return res.status(200).send('Username is taken.')
    }

    if (!emailTaken) {
      const userForSave = new User({
        username,
        email,
        password,
        tradeURL
      })

      const user = await userForSave.save()

      const token = await userForSave.generateAuthToken()

      return res.status(201).send({ user, token })
    } else {
      return res.status(200).send('E-mail is already used by another account.')
    }
  } catch(err) {
    return res.status(500).send(err)
  }
})

router.post('/login', async (req, res) => {
  const email = req.body.email
  const password = req.body.password

  try {
      const user = await User.findByCredentials(email, password)
      const token = await user.generateAuthToken()
      res.status(200).send({ user, token })
  } catch(err) {
      log(err)
      res.status(400).send("error") 
  }
})

router.get('/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch(err) {
        res.status(500).send()
    }
})

router.get('/get-user-credits', auth, async(req, res) => {
  const id = req.user._id

  try {
    const user = await User.findById(id, `credits -_id`)
    
    res.status(200).send(user)
  } catch(err) {
    res.status(400).send(err)
  }
})

router.post('/get-wpn-prices', async(req, res) => {
  const id = req.user._id
  const wpns = req.body.wpns

  try {
    // const user = await User.findOne({ uid }, `credits -_id`)

    let price
    price = await steamprice.getprices(730, wpns, '1')


    console.log(price)
    res.status(200).send(price)
  } catch(err) {
    res.status(400).send(err)
  }
})

router.get('/get-user-skins', auth, async(req, res) => {
  const id = req.user._id

  try {
    const user = await User.findById(id, `skins -_id`)

    let skins = []
    await Promise.all(user.skins.map(async (skinID) => {
      let data = await Skin.findById(skinID)

      skins.push(data)
    }))

    return res.status(200).send(skins)
  } catch(err) {
    log(err)
    return res.status(400).send(err) 
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
        'usp-s_flashback'
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
        'sg_553_aloha',
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

  const gunConditions = {
    "ak-47_asiimov": ["bs"],
    "awp_neo-noir": ["bs"],
    "desert_eagle_mecha_industries": ["bs"],
    "mp5-sd_phosphor": ["ft"],
    "ump-45_momentum": ["bs"],
    "usp-s_flashback": ["ft"],
    "p250_nevermore": ["ft"],
    "galil_ar_signal": ["ft"],
    "mac-10_pipe_down": ["ww", "bs"],
    "g3sg1_scavenger": ["ww", "bs"],
    "m4a4_magnesium": ["*"],
    "glock-18_oxide_blaze": ["*"],
    "tec-9_fubar": ["*"],
    "mp9_modest_threat": ["*"],
    "sg553_danger_close": ["*"],
    "sawed-off_black_sand": ["*"],
    "nova_wood_fired": ["*"],
    "awp_asiimov": ["bs"],
    "aug_chameleon": ["ft"],
    "ak-47_redline": ["bs"],
    "nova_antique": ["ft"],
    "p90_trigon": ["ft"],
    "usp-s_guardian": ["ft"],
    "sg_553_pulse": ["bs"],
    "mac-10_heat": ["bs"],
    "famas_sergeant": ["bs"],
    "tec-9_sandstorm": ["*"],
    "negev_terrain": ["*"],
    "mag-7_heaven_guard": ["*"],
    "ump-45_corporal": ["*"],
    "m4a1-s_hyper_beast": ["ww", "bs"],
    "mac-10_neon_rider": ["ft"],
    "galil_ar_eco": ["ww", "bs"],
    "five-seven_monkey_business": ["ww", "bs", "ft"],
    "famas_djinn": ["ww", "ft"],
    "awp_worm_god": ["ft"],
    "mag-7_heat": ["ww", "bs"],
    "cz75-auto_pole_position": ["bs", "ft"],
    "ump-45_grand_prix": ["ft"],
    "ak-47_elite_build": ["*"],
    "desert_eagle_bronze_deco": ["*"],
    "p250_valence": ["*"],
    "mp7_armor_core": ["*"],
    "sawed-off_origami": ["*"],
    "negev_man-o-'war": ["*"],
    "desert_eagle_printstream": ["bs"],
    "ak-47_legion_of_anubis": ["bs"],
    "m4a4_toothfairy": ["bs"],
    "glock-18_vogue": ["bs"],
    "xm1014_entombed": ["ww", "bs"],
    "mag-7_monster_call": ["bs"],
    "mac-10_allure": ["bs", "ww"],
    "tec-9_brother": ["bs", "ww"],
    "mp5-sd_kitbash": ["bs"],
    "galil_ar_connexion": ["bs"],
    "ssg_08_mainframe_001": ["*"],
    "p250_cassette": ["*"],
    "pp-bizon_runic": ["*"],
    "p90_freight": ["*"],
    "p2000_gnarled": ["*"],
    "sg_553_ol'rusty": ["*"],
    "negev_ultralight": ["*"],
    "m4a4_neo-noir": ["bs"],
    "mp7_bloodsport": ["bs"],
    "usp-s_cortex": ["bs"],
    "awp_mortis": ["ft"],
    "aug_stymphalian": ["bs", "ft"],
    "glock-18_moonrise": ["bs", "ft"],
    "mag-7_swag-7": ["ft", "bs", "ww"],
    "ump-45_artic_wolf": ["bs", "ft"],
    "nova_wild_six": ["bs", "ft"],
    "negev_lionfish": ["ft", "bs"],
    "mp9_black_sand": ["*"],
    "r8_revolver_grip": ["*"],
    "sg_553_aloha": ["*"],
    "five-seven_flame_test": ["*"],
    "p2000_urban_hazard": ["*"],
    "pp-bizon_night_riot": ["*"],
    "xm1014_oxide_blaze": ["*"]
  }

  let skinGrade
  let skinCon

  // Get Skin Grade
  skinGrade = Math.random() * 100
  skinGrade = Math.round(skinGrade * 100) / 100

  const getGrade = () => {
    if (skinGrade >= 0 && skinGrade < 3) return 'classified' 
    else if (skinGrade >= 3 && skinGrade < 15.00) return 'restricted'
    else if (skinGrade >= 15.00) return 'mil_spec'
  }

  skinGrade = getGrade()

  const arrLen = wpnCases[caseName][skinGrade].length
  const skinIndex = Math.floor(Math.random() * (arrLen - 0) + 0)

  const skin = wpnCases[caseName][skinGrade][skinIndex]
  const formattedSkin = formattedSkinName[caseName][skinGrade][skinIndex]

  skinCon = gunConditions[skin]

  if (skinCon[0] === '*') skinCon = ['bs', 'ww', 'ft', 'mw', 'fn']

  skinCon = skinCon[Math.floor(Math.random()*skinCon.length)]

  return { formattedSkin, skin, skinGrade, skinCon }
}

router.post('/buy-case', auth, async(req, res) => {
  const id = req.user._id
  const caseName = req.body.caseName

  const cases = ['dangerZone', 'chroma2', 'clutch', 'fracture', 'phoenix']
  const casePrices = [400, 500, 600, 800, 1000]

  const caseIndex = cases.indexOf(caseName)

  const user = await User.findById(id, `-_id  credits tradeURL referredTo`)
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
      await User.findByIdAndUpdate(id, {
        credits: userCredits - creditsRequired
      })

      const saveSkin = new Skin({
        skin,
        grade: skinGrade,
        condition: skinCon,
        caseName,
        userID: id
      })

      saveSkin.save()

      // Save Skin reference to User
      const userSaveSkinRef = await User.findById(id)
      userSaveSkinRef.skins.push(saveSkin._id)
      await userSaveSkinRef.save()

      if (user) {
        await User.findOneAndUpdate({ username: user.referredTo }, {
          $inc : {
            'credits': 15
          }
        })
      }
    } catch(err) {
      return res.status(500).send(err)
    }
  } else {
    return res.status(400).send("Not enough moneros Sunny. And cheating ain't nice")
  }

  res.status(200).send({ skin: formattedSkin, skinLonghand: skin, skinGrade, skinCon })
})

router.get('/check-profitability', async(req, res) => {
  const key = req.body.key // secret key

  const casePrice = 0.4

  let skinPrices = 0
  let caseIncome = 0
  let querySkins = []
  let casesOpened = 0

  const amountOfDrops = 25000

  const shorthandCondition = ['fn', 'mw', 'ft', 'ww', 'bs']
  const conditions = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred']

  const skins = [
    "desert_eagle_mecha_industries",
    "mp5-sd_phosphor",
    "ump-45_momentum",
    "usp-s_flashback",
    "p250_nevermore",
    "galil_ar_signal",
    "mac-10_pipe_down",
    "g3sg1_scavenger",
    "m4a4_magnesium",
    "glock-18_oxide_blaze",
    "tec-9_fubar",
    "mp9_modest_threat",
    "sg553_danger_close",
    "sawed-off_black_sand",
    "nova_wood_fired"
  ]
  
  const skinsFormatted = [
    "Desert Eagle | Mecha Industries",
    "UMP-45 | Momentum",
    "MP5-SD | Phosphor",
    "USP-S | Flashback",
    "P250 | Nevermore",
    "Galil AR | Signal",
    "MAC-10 | Pipe Down",
    "G3SG1 | Scavenger",
    "M4A4 | Magnesium",
    "Glock-18 | Oxide Blaze",
    "Tec-9 | Fubar",
    "MP9 | Modest Threat",
    "SG553 | Danger Close",
    "Sawed-Off | Black Sand",
    "Nova | Wood Fired"
  ]

  const pricesOfSkins = {
    "Desert Eagle | Mecha Industries (Well-Worn)": 5.08,
    "Desert Eagle | Mecha Industries (Battle-Scarred)": 4,

    "MP5-SD | Phosphor (Well-Worn)": 3.27,
    "MP5-SD | Phosphor (Battle-Scarred)": 2.9,

    "UMP-45 | Momentum (Factory New)": 6.34,
    "UMP-45 | Momentum (Minimal Wear)": 4.28,
    "UMP-45 | Momentum (Field-Tested)": 3.07,
    "UMP-45 | Momentum (Well-Worn)": 3,
    "UMP-45 | Momentum (Battle-Scarred)": 3.11,

    "USP-S | Flashback (Factory New)": 1.1,
    "USP-S | Flashback (Minimal Wear)": 0.81,
    "USP-S | Flashback (Field-Tested)": 0.69,
    "USP-S | Flashback (Well-Worn)": 0.99,
    "USP-S | Flashback (Battle-Scarred)": 1.11,

    "P250 | Nevermore (Factory New)": 0.93,
    "P250 | Nevermore (Minimal Wear)": 0.61,
    "P250 | Nevermore (Field-Tested)": 0.41,
    "P250 | Nevermore (Well-Worn)": 0.55,
    "P250 | Nevermore (Battle-Scarred)": 0.55,

    "Galil AR | Signal (Factory New)": 0.92,
    "Galil AR | Signal (Minimal Wear)": 0.59,
    "Galil AR | Signal (Field-Tested)": 0.39,
    "Galil AR | Signal (Well-Worn)": 0.40,
    "Galil AR | Signal (Battle-Scarred)": 0.40,

    "MAC-10 | Pipe Down (Factory New)": 1.2,
    "MAC-10 | Pipe Down (Minimal Wear)": 0.6,
    "MAC-10 | Pipe Down (Field-Tested)": 0.39,
    "MAC-10 | Pipe Down (Well-Worn)": 0.34,
    "MAC-10 | Pipe Down (Battle-Scarred)": 0.32,

    "G3SG1 | Scavenger (Factory New)": 0.92,
    "G3SG1 | Scavenger (Minimal Wear)": 0.59,
    "G3SG1 | Scavenger (Field-Tested)": 0.38,
    "G3SG1 | Scavenger (Well-Worn)": 0.37,
    "G3SG1 | Scavenger (Battle-Scarred)": 0.32,

    "M4A4 | Magnesium (Factory New)": 1.58,
    "M4A4 | Magnesium (Minimal Wear)": 0.46,
    "M4A4 | Magnesium (Field-Tested)": 0.21,
    "M4A4 | Magnesium (Well-Worn)": 0.17,
    "M4A4 | Magnesium (Battle-Scarred)": 0.13,

    "Glock-18 | Oxide Blaze (Factory New)": 0.3,
    "Glock-18 | Oxide Blaze (Minimal Wear)": 0.12,
    "Glock-18 | Oxide Blaze (Field-Tested)": 0.09,
    "Glock-18 | Oxide Blaze (Well-Worn)": 0.14,
    "Glock-18 | Oxide Blaze (Battle-Scarred)": 0.09,

    "Tec-9 | Fubar (Factory New)": 0.65,
    "Tec-9 | Fubar (Minimal Wear)": 0.65,
    "Tec-9 | Fubar (Field-Tested)": 0.08,
    "Tec-9 | Fubar (Well-Worn)": 0.08,
    "Tec-9 | Fubar (Battle-Scarred)": 0.08,

    "MP9 | Modest Threat (Factory New)": 0.21,
    "MP9 | Modest Threat (Minimal Wear)": 0.12,
    "MP9 | Modest Threat (Field-Tested)": 0.08,
    "MP9 | Modest Threat (Well-Worn)": 0.10,
    "MP9 | Modest Threat (Battle-Scarred)": 0.09,

    "SG553 | Danger Close (Factory New)": 0.20,
    "SG553 | Danger Close (Minimal Wear)": 0.10,
    "SG553 | Danger Close (Field-Tested)": 0.08,
    "SG553 | Danger Close (Well-Worn)": 0.10,
    "SG553 | Danger Close (Battle-Scarred)": 0.07,

    "Sawed-Off | Black Sand (Factory New)": 0.2,
    "Sawed-Off | Black Sand (Minimal Wear)": 0.1,
    "Sawed-Off | Black Sand (Field-Tested)": 0.08,
    "Sawed-Off | Black Sand (Well-Worn)": 0.08,
    "Sawed-Off | Black Sand (Battle-Scarred)": 0.08,

    "Nova | Wood Fired (Factory New)": 0.17,
    "Nova | Wood Fired (Minimal Wear)": 0.10,
    "Nova | Wood Fired (Field-Tested)": 0.08,
    "Nova | Wood Fired (Well-Worn)": 0.09,
    "Nova | Wood Fired (Battle-Scarred)": 0.08
  }

  let i
  for (i = 0; i < amountOfDrops; i++) {
    let data = getWeapon('dangerZone')

    skin = data.skin
    skinCon = data.skinCon

    const conIndex = shorthandCondition.indexOf(skinCon)
    skinCon = conditions[conIndex] 

    const skinIndex = skins.indexOf(skin)
    skin = skinsFormatted[skinIndex]
    console.log(data.skin)

    const query = `${skin} (${skinCon})`

    price = pricesOfSkins[query]
    log(`${query} ${pricesOfSkins[query]}`)

    if (data.skinGrade !== 'mil_spec') {
      skinPrices += price
    }
    casesOpened++
  }

  caseIncome = casePrice * amountOfDrops

  return res.status(200).send({
    brojOtvorenihKutija: casesOpened,
    cijenaJedneKutijeKodNas: casePrice,
    sveukupnaZaradaOdProdavanjaKutijaEUR: caseIncome,
    sveukupnoIsplacenoSkinovaEUR: skinPrices,
    profitEUR: caseIncome - skinPrices
  })

  // res.send(querySkins)
  // return res.send(querySkins)

  // querySkins = [
  //   "Sawed-Off | Black Sand (Minimal Wear)", "Galil AR | Signal (Well-Worn)", "Nova | Wood Fired (Factory New)"
  // ]

  // let price = 0
  // try {
  //   price = await steamprice.getprices(730, "Sawed-Off | Black Sand (Minimal Wear)", '1')
  // } catch(err) {
  //   log(err)
  // }

  // res.status(200).send(price)

  // try {
  //   let price
  //   await Promise.all(querySkins.map(async (newQuery) => {
  //     price = await steamprice.getprices(730, "Sawed-Off | Black Sand (Minimal Wear)", '1')

  //     price = price[0].lowest_price
  //     price = price.substring(1)

  //     skinPrices += price
  //     casesOpened++
  //   }))

  //   caseIncome = casePrice * amountOfDrops

  //   res.status(200).send({
  //     casePrice,
  //     caseIncome,
  //     profit: caseIncome - casePrice,
  //     casesOpened
  //   })
  // } catch(err) {
  //   res.status(400).send(err)
  // }
})

// const wpnsFormatted = 
    // ['Desert Eagle', 'Dual Berettas', 'Five-SeveN', 'Glock-18',
    // 'CZ75-Auto', 'P2000', 'P250', 'R8 Revolver', 'Tec-9', 'USP-S',
    // 'MAG-7', 'Nova', 'Sawed-Off', 'XM1014', 'M249', 'Negev',
    // 'MAC-10',  'MP5-SD',  'MP7',  'MP9',  'P90',  'PP-Bizon',  'UMP-45',
    // 'AK-47', 'AUG', 'FAMAS', 'Galil AR', 'M4A1-S', 'M4A4', 'SG 553',
    // 'AWP', 'G3SG1', 'SCAR-20', 'SSG 08']

router.post('/request-trade', auth, async(req, res) => {
  const skinID = req.body.skinID

  try {
    await Skin.findByIdAndUpdate(skinID, {
      requestedTrade: true,
      tradeRequestedAt: new Date()
    })
  
    return res.status(200).send()
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

function normalizeSkinName(skin, skinCon) {
  const skins = {
        "ak-47_asiimov": "AK-47 | Asiimov",
        "awp_neo-noir": "AWP | Neo-Noir",
        "desert_eagle_mecha_industries": "Desert Eagle | Mecha Industries",
        "mp5-sd_phosphor": "MP5-SD | Phosphor",
        "ump-45_momentum": "UMP-45 | Momentum",
        "usp-s_flashback": "USP-S | Flashback",
        "p250_nevermore": "P250 | Nevermore",
        "galil_ar_signal": "Galil AR | Signal",
        "mac-10_pipe_down": "MAC-10 | Pipe Down",
        "g3sg1_scavenger": "G3SG1 | Scavenger",
        "m4a4_magnesium": "M4A4 | Magnesium",
        "glock-18_oxide_blaze": "Glock-18 | Oxide Blaze",
        "tec-9_fubar": "Tec-9 | Fubar",
        "mp9_modest_threat": "MP9 | Modest Threat",
        "sg553_danger_close": "SG 553 | Danger Close",
        "sawed-off_black_sand": "Sawed-Off | Black Sand",
        "nova_wood_fired": "Nova | Wood Fired",
        "awp_asiimov": "AWP | Asiimov",
        "aug_chameleon": "AUG | Chameleon",
        "ak-47_redline": "AK-47 | Redline",
        "nova_antique": "Nova | Antique",
        "p90_trigon": "P90 | Trigon",
        "usp-s_guardian": "USP-S | Guardian",
        "sg_553_pulse": "SG 553 | Pulse",
        "mac-10_heat": "MAC-10 | Heat",
        "famas_sergeant": "FAMAS | Sergeant",
        "tec-9_sandstorm": "Tec-9 | Sandstorm",
        "negev_terrain": "Negev | Terrain",
        "mag-7_heaven_guard": "MAG-7 | Heaven Guard",
        "ump-45_corporal": "UMP-45 | Corporal",
        "m4a1-s_hyper_beast": "M4A1-S | Hyper Beast",
        "mac-10_neon_rider": "MAC-10 | Neon Rider",
        "galil_ar_eco": "Galil AR | Eco",
        "five-seven_monkey_business": "Five-SeveN | Monkey Business",
        "famas_djinn": "FAMAS | Djinn",
        "awp_worm_god": "AWP | Worm God",
        "mag-7_heat": "MAG-7 | Heat",
        "cz75-auto_pole_position": "CZ75-Auto | Pole Position",
        "ump-45_grand_prix": "UMP-45 | Grand Prix",
        "ak-47_elite_build": "AK-47 | Elite Build",
        "desert_eagle_bronze_deco": "Desert Eagle | Bronze Deco",
        "p250_valence": "P250 | Valence",
        "mp7_armor_core": "MP7 | Armor Core",
        "sawed-off_origami": "Sawed-Off | Origami",
        "negev_man-o-'war": "Negev | Man-o'-war",
        "desert_eagle_printstream": "Desert Eagle | Printstream",
        "ak-47_legion_of_anubis": "AK-47 | Legion of Anubis",
        "m4a4_toothfairy": "M4A4 | Tooth Fairy",
        "glock-18_vogue": "Glock-18 | Vogue",
        "xm1014_entombed": "XM1014 | Entombed",
        "mag-7_monster_call": "MAG-7 | Monster Call",
        "mac-10_allure": "MAC-10 | Allure",
        "tec-9_brother": "Tec-9 | Brother",
        "mp5-sd_kitbash": "MP5-SD | Kitbash",
        "galil_ar_connexion": "Galil AR | Connexion",
        "ssg_08_mainframe_001": "SSG 08 | Mainframe 001",
        "p250_cassette": "P250 | Cassette",
        "pp-bizon_runic": "PP-Bizon | Runic",
        "p90_freight": "P90 | Freight",
        "p2000_gnarled": "P2000 | Gnarled",
        "sg_553_ol'rusty": "SG 553 | Ol' Rusty",
        "negev_ultralight": "Negev | Ultralight",
        "m4a4_neo-noir": "M4A4 | Neo-Noir",
        "mp7_bloodsport": "MP7 | Bloodsport",
        "usp-s_cortex": "USP-S | Cortex",
        "awp_mortis": "AWP | Mortis",
        "aug_stymphalian": "AUG | Stymphalian",
        "glock-18_moonrise": "Glock-18 | Moonrise",
        "mag-7_swag-7": "MAG-7 | SWAG-7",
        "ump-45_artic_wolf": "UMP-45 | Arctic Wolf",
        "nova_wild_six": "Nova | Wild Six",
        "negev_lionfish": "Negev | Lionfish",
        "mp9_black_sand": "MP9 | Black Sand",
        "r8_revolver_grip": "R8 Revolver | Grip",
        "sg_553_aloha": "SG 553 | Aloha",
        "five-seven_flame_test": "Five-SeveN | Flame Test",
        "p2000_urban_hazard": "P2000 | Urban Hazard",
        "pp-bizon_night_riot": "PP-Bizon | Night Riot",
        "xm1014_oxide_blaze": "XM1014 | Oxide Blaze"
    }


  // condition
  const conditions = {
    "fn": "Factory New",
    "mw": "Minimal Wear",
    "ft": "Field-Tested",
    "ww": "Well-Worn",
    "bs": "Battle-Scarred"
  }

  const condition = conditions[skinCon]

  return `${skins[skin]} | (${condition})`
}

router.post('/view-trade-requests', async(req, res) => {
  const powerSecret = req.body.powerSecret

  if (powerSecret !== process.env.FETCH_SKINS_SECRET) {
    throw new Error ('Unauthorized.')
  }

  try {
    let skins = await Skin.find({ requestedTrade: true },
      `_id skin condition userID tradeRequestedAt`)

    skins.sort(function(a, b){
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return new Date(a.tradeRequestedAt) - new Date(b.tradeRequestedAt)
    })

    function openedAgo(timestamp) {
      return moment(timestamp).fromNow()
    }

    // console.log(skins)

    let skinIDs = []
    let skinsWTradeURL = []
    await Promise.all(skins.map(async (skin) => {
      const user = await User.findById(skin.userID, `-_id tradeURL`)

      let normalizedSkinName = normalizeSkinName(skin.skin, skin.condition)

      let skinWTradeURL = {
        skinID: skin._id,
        skinName: normalizedSkinName,
        tradeURL: user.tradeURL,
        tradeRequestedAt: openedAgo(skin.tradeRequestedAt)
      }
      
      skinIDs.push(skin._id)
      skinsWTradeURL.push(skinWTradeURL)
    }))

    return res.status(200).send({ skinsWTradeURL, skinIDs })
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

router.post('/finish-trade-offers', async(req, res) => {
  const powerSecret = req.body.powerSecret
  const skinIDs = req.body.skinIDs

  if (powerSecret !== process.env.FETCH_SKINS_SECRET) {
    throw new Error ('Unauthorized.')
  }

  try {
    await Promise.all(skinIDs.map(async (skinID) => {
      await Skin.findByIdAndUpdate(skinID, {
        tradeOfferSent: true
      })
    }))

    res.status(200).send("Trade offers su označeni kao poslani.")
  } catch(err) {
    res.status(400).send("Nešto si pogrešno unjeo.")
  }
})

function getSkinPrice(caseName, grade, condition) {
  const skinPrices = {
    "dangerZone": {
      "mil_spec": {
        "fn": 20,
        "mw": 15,
        "ft": 12,
        "ww": 9,
        "bs": 7
      },
      "restricted": {
        "fn": 135,
        "mw": 90,
        "ft": 60,
        "ww": 50,
        "bs": 45
      },
      "classified": {
        "ww": 475,
        "bs": 400
      }
    },
    "chroma2": {
      "mil_spec": {
        "fn": 30,
        "mw": 20,
        "ft": 15,
        "ww": 12,
        "bs": 10
      },
      "restricted": {
        "fn": 135,
        "mw": 80,
        "ft": 45,
        "ww": 30,
        "bs": 15
      },
      "classified": {
        "ww": 350,
        "bs": 200
      }
    },
    "clutch": {
      "mil_spec": {
        "fn": 17,
        "mw": 15,
        "ft": 12,
        "ww": 10,
        "bs": 8
      },
      "restricted": {
        "fn": 150,
        "mw": 80,
        "ft": 45,
        "ww": 25,
        "bs": 15
      },
      "classified": {
        "ww": 260,
        "bs": 150
      }
    },
    "fracture": {
      "mil_spec": {
        "fn": 30,
        "mw": 20,
        "ft": 15,
        "ww": 12,
        "bs": 10
      },
      "restricted": {
        "fn": 250,
        "mw": 180,
        "ft": 100,
        "ww": 70,
        "bs": 60
      },
      "classified": {
        "ww": 900,
        "bs": 800
      }
    },
    "phoenix": {
      "mil_spec": {
        "fn": 40,
        "mw": 30,
        "ft": 20,
        "ww": 15,
        "bs": 12
      },
      "restricted": {
        "fn": 500,
        "mw": 360,
        "ft": 160,
        "ww": 145,
        "bs": 215
      },
      "classified": {
        "ww": 750,
        "bs": 600
      }
    }
  }

  return skinPrices[caseName][grade][condition]
}

router.post('/sell-skin', auth, async(req, res) => {
  const skinID = req.body.skinID
  const userID = req.user._id

  try {
    const skin = await Skin.findById(skinID)

    const price = getSkinPrice(skin.caseName, skin.grade, skin.condition)

    await User.findByIdAndUpdate(userID, {
      $inc: {
        credits: price
      }
    })

    await User.findByIdAndUpdate(userID, {
      $pull: {
        skins: skinID
      }
    })

    await Skin.findByIdAndDelete(skinID)
  
    return res.status(200).send()
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

router.post('/set-referral', auth, async(req, res) => {
  const user = req.user
  const referralCode = req.body.referralCode

  if (user.referredTo) {
    return res.status(400).send('Bad request.')
  }

  user.referredTo = referralCode
  user.credits = user.credits + 100

  try {
    await user.save()

    return res.status(200).send()
  } catch(err) {
    return res.status(400).send()
  }
})

router.post('/update-trade-url', auth, async(req, res) => {
  const user = req.user
  const tradeURL = req.body.tradeURL

  user.tradeURL = tradeURL

  try {
    await user.save()

    res.status(200).send()
  } catch(err) {
    res.status(400).send()
  }
})

module.exports = router