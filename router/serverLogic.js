const express = require('express')
const auth = require('../middleware/auth')
const firebase = require('firebase')
const steamprice = require('steam-price-api')
const csgomarket = require('csgo-market')
const router = new express.Router()
const moment = require('moment')
const nodemailer = require("nodemailer")
const generator = require('generate-password')
const User = require('../models/user')
const Skin = require('../models/skin')
const Giveaway = require('../models/giveaway')
const PasswordReset = require('../models/passwordReset')
const data = require('../data/usernames')
const log = console.log

// Giveaways interval
setInterval(async () => {
  let day = moment().day()
  let hour = moment().hour()

  // If Sunday 00:00
  if (day === 7 && hour === 0) {
    let giveaway = await Giveaway.findById(giveawayDocID, `-_id weeklyUserPool`)
    let weeklyEntrants = giveaway.weeklyUserPool

    let winner = weeklyEntrants[Math.floor(Math.random() * weeklyEntrants.length)]

    await Giveaway.findOneAndUpdate(giveawayDocID, {
      currentWeeklyWinner: winner
    })

    await User.updateMany({}, { tickets: 0 })

    await Giveaway.findOneAndUpdate(giveawayDocID, {
      weeklyUserPool: []
    })
  }

  // Choose daily winner
  if (hour === 0) {
    let giveaway = await Giveaway.findById(giveawayDocID, `-_id dailyUserPool`)
    dailyEntrants = giveaway.dailyUserPool

    let winner = dailyEntrants[Math.floor(Math.random() * dailyEntrants.length)]

    await Giveaway.findOneAndUpdate(giveawayDocID, {
      currentDailyWinner: winner
    })
  }

}, 3600000)

const giveawayDocID = '602bb5f27d5b6c0c10d3b04b'
router.post('/buy-ticket', auth, async(req, res) => {
  const user = req.user
  const ticketPrice = 30

  try {
    console.log(user.credits)
    if (user.credits >= ticketPrice) {
      user.credits -= ticketPrice
      user.tickets += 1
  
      await Giveaway.findByIdAndUpdate(giveawayDocID, 
        { $push: { weeklyUserPool: user.username } }
      )
  
      await user.save()

      return res.status(200).send()
    }

    return res.status(400).send()
  } catch(err) {
    console.log(err)
    return res.status(500).send()
  }
})

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

const skinGradesOpenedRef = firestore.collection('skinGradesOpened')

let skinGradesOpened = [0, 0, 0, 0, 0]
skinGradesOpenedRef.onSnapshot((snap) => {
  snap.docs.forEach(doc => {
    skinGradesOpened[0] = doc.data().mil_spec
    skinGradesOpened[1] = doc.data().restricted
    skinGradesOpened[2] = doc.data().classified
    skinGradesOpened[3] = doc.data().covert
    skinGradesOpened[4] = doc.data().exceedingly_rare
  })
})

function updateCasesOpened(caseName, grade) {
  const docRef = firestore.collection("casesOpened").doc('ZiXgrpmWCfUiEy6t3Hfw')
  const docSkinGrades = firestore.collection("skinGradesOpened").doc('rmHWnoBk97YLUf6GRQbl')

  if (caseName === 'dangerZone') {
      docRef.update({
        dangerZone: casesOpened[0] + 1
    })
  }

  else if (caseName === 'chroma2') {
      docRef.update({
        chroma2: casesOpened[1] + 1
    })
  }

  else if (caseName === 'clutch') {
    docRef.update({
        clutch: casesOpened[2] + 1
    })
  }

  else if (caseName === 'fracture') {
    docRef.update({
        fracture: casesOpened[3] + 1
    })
  }

  else if (caseName === 'phoenix') {
      docRef.update({
        phoenix: casesOpened[4] + 1
    })
  }

  switch (grade) {
    case 'mil_spec':
      docSkinGrades.update({
        mil_spec: skinGradesOpened[0] + 1
      })
      break;
    case 'restricted':
      docSkinGrades.update({
        restricted: skinGradesOpened[1] + 1
      })
      break;
    case 'classified':
      docSkinGrades.update({
        classified: skinGradesOpened[2] + 1
      })
      break;
    case 'covert':
      docSkinGrades.update({
        covert: skinGradesOpened[3] + 1
      })
      break;
    case 'exceedingly_rare':
      docSkinGrades.update({
        exceedingly_rare: skinGradesOpened[4] + 1
      })
      break;
    default:
      break;
  }
}

function addSkinToLiveDrops(skin) {
  firestore.collection("drops").add(skin)
}

 // for drop speed by userCount
 let defaultUserCount = 0
 let currentHour = 18

function getHour() {
    let d = new Date();
    currentHour = d.getHours();

    const userCounts = [
      268, 254, 125, 45, 34, 17, 12, 26,
      56, 87, 125, 147, 216, 246, 215, 220,
      266, 284, 312, 352, 321, 275, 234, 254
  ]

  return userCounts[currentHour]
}

let interval = Math.floor(Math.random() * (90000 - (100 * getHour())))

const iterator = () => {
  // Choose Case
  let caseName = Math.random() * 100
  caseName = Math.round(caseName * 100) / 100

  const chooseCase = () => {
    if (caseName >= 0 && caseName < 5) return 'phoenix' 
    else if (caseName >= 5 && caseName < 12.00) return 'fracture'
    else if (caseName >= 12.00 && caseName < 30.00) return 'clutch'
    else if (caseName >= 30.00 && caseName < 55.00) return 'chroma2'
    else if (caseName > 55.00) return 'dangerZone'
  }

  caseName = chooseCase()

  const wpn = getWeapon(caseName, true)

  let uname = data.usernames[Math.floor(Math.random() * data.usernames.length)]

  addSkinToLiveDrops({
    uname,
    skin: wpn.formattedSkin,
    longhand: wpn.skin,
    grade: wpn.skinGrade,
    condition: wpn.skinCon,
    timeOpened: Number(Date.now())
  })

  updateCasesOpened(caseName, wpn.skinGrade)

  let userCount = getHour()

  interval = Math.floor(Math.random() * (200000 - (100 * userCount)))

  setTimeout(iterator, interval)
}

setTimeout(() => {
  iterator()
}, interval)

const casesOpenedRef = firestore.collection('casesOpened')

let casesOpened = [0, 0, 0, 0, 0]
casesOpenedRef.onSnapshot((snap) => {
  snap.docs.forEach(doc => {
    casesOpened[0] = doc.data().dangerZone
    casesOpened[1] = doc.data().chroma2
    casesOpened[2] = doc.data().clutch
    casesOpened[3] = doc.data().fracture
    casesOpened[4] = doc.data().phoenix
  })
})

const gunNames = {
  dangerZone: [
      'Nova',
      'Sawed-Off',
      'SG 553',
      'MP9',
      'Tec-9',
      'Glock-18',
      'M4A4',
      'G3SG!',
      'MAC-10',
      'Galil AR',
      'P250',
      'USP-S',
      'MP5-SD',
      'UMP-45',
      'Desert Eagle',
      'AWP',
      'AK-47'
  ],
  phoenix: [
      'UMP-45',
      'MAG-7',
      'Negev',
      'Tec-9',
      'Famas',
      'MAC-10',
      'SG 553',
      'USP-S',
      'P90',
      'Nova',
      'AK-47',
      'AUG',
      'AWP'
  ],
  chroma2: [
      "Negev",
      "Sawed-Off",
      "MP7",
      "P250",
      "Desert Eagle",
      "AK-47",
      "UMP-45",
      "CZ75-Auto",
      "MAG-7",
      "AWP",
      "FAMAS",
      "Five-SeveN",
      "Galil AR",
      "MAC-10",
      "M4A1-S"
  ],
  fracture: [
      'Negev',
      "SG 553",
      'P2000',
      'P90',
      'PP-Bizon',
      'P250',
      'SSG 08',
      'Galil AR',
      'MP5-SD',
      'Tec-9',
      'MAC-10',
      'MAG-7',
      'XM1014',
      'Glock-18',
      'M4A4',
      'AK-47',
      'Desert Eagle'
  ],
  clutch: [
    'XM1014',
    'PP-Bizon',
    'P2000',
    'FFive-SeveN',
    'SG 553',
    'R8 Revolver',
    'MP9',
    'Negev',
    'Nova',
    'UMP-45',
    'MAG-7',
    'Glock-18',
    'AUG',
    'AWP',
    'USP-S',
    'MP7',
    'M4A4'
  ]
}

const gunSkinNames = {
  dangerZone: [
    'Wood Fired',
    'Black Sand',
    'Danger Close',
    'Modest Threat',
    'Fubar',
    'Oxide Blaze',
    'Magnesium',
    'Scavenger',
    'Pipe Down',
    'Signal',
    'Nevermore',
    'Flashback',
    'Phosphor',
    'Momentum',
    'Mecha Industries',
    'Neo-Noir',
    'Asiimov'
  ],
  phoenix: [
    'Corporal',
    'Heaven Guard',
    'Terrain',
    'Sandstorm',
    'Sergeant',
    'Heat',
    'Pulse',
    'Guardian',
    'Trigon',
    'Antique',
    'Redline',
    'Chameleon',
    'Asiimov'
  ],
  chroma2: [
      "Man-o'-war",
      'Origami',
      'Armor Core',
      'Valence',
      'Bronze Deco',
      'Elite Build',
      'Grand Prix',
      'Pole Position',
      'Heat',
      'Worm God',
      'Djinn',
      'Monkey Business',
      'Eco',
      'Neon Rider',
      'Hyper Beast'
  ],
  fracture: [
      'Ultralight',
      "Ol' Rusty",
      'Gnarled',
      'Freight',
      'Runic',
      'Cassette',
      'Mainframe 001',
      'Connexion',
      'Kitbash',
      'Brother',
      'Allure',
      'Monster Call',
      'Entombed',
      'Vogue',
      'Tooth Fairy',
      'Legion of Anubis',
      'Printstream'
  ],
  clutch: [
      'Oxide Blaze',
      'Night Riot',
      'Urban Hazard',
      'Flame Test',
      'Aloha',
      'Grip',
      'Black Sand',
      'Lionfish',
      'Wild Six',
      'Arctic Wolf',
      'SWAG-7',
      'Moonrise',
      'Stymphalian',
      'Mortis',
      'Cortex',
      'Bloodsport',
      'Neo-Noir'
  ]
}

router.get('/get-user', auth, async(req, res) => {
  return res.status(200).send(req.user)
})

const sendConfirmationEmail = async(email, emailVerificationCode) => {
  console.log(email, emailVerificationCode)

  let transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 465,
    secure: true,
    auth: {
      user: 'support@revo-cases.com',
      pass: '!!Winter99!!'
    },
  })

  const myHTML = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>New message</title> <!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]--> <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> <!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--> <!--[if !mso]><!-- --><link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet"> <!--<![endif]--><style type="text/css">.rollover:hover .rollover-first {	max-height:0px!important;	display:none!important;}.rollover:hover .rollover-second {	max-height:none!important;	display:block!important;}#outlook a {	padding:0;}.es-button {	mso-style-priority:100!important;	text-decoration:none!important;}a[x-apple-data-detectors] {	color:inherit!important;	text-decoration:none!important;	font-size:inherit!important;	font-family:inherit!important;	font-weight:inherit!important;	line-height:inherit!important;}.es-desk-hidden {	display:none;	float:left;	overflow:hidden;	width:0;	max-height:0;	line-height:0;	mso-hide:all;}.es-button-border:hover {	border-style:solid solid solid solid!important;	background:#0b317e!important;	border-color:#42d159 #42d159 #42d159 #42d159!important;}@media only screen and (max-width:600px) {.st-br { padding-left:10px!important; padding-right:10px!important } p, ul li, ol li, a { font-size:16px!important; line-height:150%!important } h1 { font-size:30px!important; text-align:center; line-height:120%!important } h2 { font-size:26px!important; text-align:center; line-height:120%!important } h3 { font-size:20px!important; text-align:center; line-height:120%!important } h1 a { font-size:30px!important; text-align:center } h2 a { font-size:26px!important; text-align:center } h3 a { font-size:20px!important; text-align:center } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } a.es-button, button.es-button { font-size:16px!important; display:block!important; border-left-width:0px!important; border-right-width:0px!important } }</style></head>
  <body style="width:100%;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div class="es-wrapper-color" style="background-color:#F8F9FD"> <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f8f9fd"></v:fill> </v:background><![endif]--><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top"><tr><td valign="top" style="padding:0;Margin:0"><table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr><td align="center" bgcolor="#071f4f" style="padding:0;Margin:0;background-color:#071F4F;background-image:url(https://nmfszx.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/10801592857268437.png);background-repeat:no-repeat;background-position:center top" background="https://nmfszx.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/10801592857268437.png"><table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"><tr><td align="left" style="Margin:0;padding-left:30px;padding-right:30px;padding-top:40px;padding-bottom:40px"><table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" style="padding:0;Margin:0;width:540px"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" height="20" style="padding:0;Margin:0"></td>
  </tr><tr><td align="left" style="padding:0;Margin:0;padding-bottom:10px"><h1 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#FFFFFF;text-align:center">Revo Cases Admin</h1></td></tr><tr><td align="center" style="padding:0;Margin:0;font-size:0px"><img src="https://nmfszx.stripocdn.email/content/guids/CABINET_4a23dd9e4733e5f6dda68400993f40c7/images/66761613648785579.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="130"></td>
  </tr><tr><td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:16px;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#FFFFFF">Please verify your e-mail below, so that if you forget your password, we can send you a password reset. We will not send you anything else, pinky swear.</p></td></tr></table></td></tr></table></td></tr></table></td>
  </tr></table><table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr><td align="center" bgcolor="#0a2b6e" style="padding:0;Margin:0;background-color:#0A2B6E;background-image:url(https://nmfszx.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/33971592408649468.png);background-repeat:no-repeat;background-position:center center" background="https://nmfszx.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/33971592408649468.png"><table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"><tr><td class="es-m-p40t es-m-p40b es-m-p20r es-m-p20l" align="left" style="padding:0;Margin:0;padding-top:40px;padding-bottom:40px"><table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" style="padding:0;Margin:0;width:600px"><table cellpadding="0" cellspacing="0" width="100%" bgcolor="#f0f3fe" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;background-color:#F0F3FE;border-radius:20px" role="presentation"><tr><td align="left" style="Margin:0;padding-bottom:10px;padding-left:20px;padding-right:20px;padding-top:25px"><h1 style="Margin:0;line-height:45px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#212121;text-align:center">Here's your code!</h1>
  </td></tr><tr><td align="center" style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:24px;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:36px;color:#FF6600"><strong>${emailVerificationCode}</strong></p></td></tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table></div></body></html>
  `

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Revo Cases Admin👻" support@revo-cases.com',
    to: email,
    subject: "Revo Cases E-mail Confirmation ✔",
    html: myHTML
  })

  console.log(info)
}

const sendPasswordReset = async(email, safeCode) => {
  console.log(email, safeCode)

  let transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 465,
    secure: true,
    auth: {
      user: 'support@revo-cases.com',
      pass: '!!Winter99!!'
    },
  })

  const passwordResetLink = `http://localhost:3000/?safecode=${safeCode}`

  const myHTML = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>Password Reset</title> <!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]--> <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> <!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--> <!--[if !mso]><!-- --><link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet"> <!--<![endif]--><style type="text/css">.rollover:hover .rollover-first {	max-height:0px!important;	display:none!important;}.rollover:hover .rollover-second {	max-height:none!important;	display:block!important;}#outlook a {	padding:0;}.es-button {	mso-style-priority:100!important;	text-decoration:none!important;}a[x-apple-data-detectors] {	color:inherit!important;	text-decoration:none!important;	font-size:inherit!important;	font-family:inherit!important;	font-weight:inherit!important;	line-height:inherit!important;}.es-desk-hidden {	display:none;	float:left;	overflow:hidden;	width:0;	max-height:0;	line-height:0;	mso-hide:all;}.es-button-border:hover {	border-style:solid solid solid solid!important;	background:#0b317e!important;	border-color:#42d159 #42d159 #42d159 #42d159!important;}td .es-button-border:hover a.es-button-1 {	background:#f87320!important;	border-color:#f87320!important;}td .es-button-border-2:hover {	background:#f87320!important;}@media only screen and (max-width:600px) {.st-br { padding-left:10px!important; padding-right:10px!important } p, ul li, ol li, a { font-size:16px!important; line-height:150%!important } h1 { font-size:30px!important; text-align:center; line-height:120%!important } h2 { font-size:26px!important; text-align:center; line-height:120%!important } h3 { font-size:20px!important; text-align:center; line-height:120%!important } h1 a { font-size:30px!important; text-align:center } h2 a { font-size:26px!important; text-align:center } h3 a { font-size:20px!important; text-align:center } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0!important } .es-m-p0r { padding-right:0!important } .es-m-p0l { padding-left:0!important } .es-m-p0t { padding-top:0!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-m-p5 { padding:5px!important } .es-m-p5t { padding-top:5px!important } .es-m-p5b { padding-bottom:5px!important } .es-m-p5r { padding-right:5px!important } .es-m-p5l { padding-left:5px!important } .es-m-p10 { padding:10px!important } .es-m-p10t { padding-top:10px!important } .es-m-p10b { padding-bottom:10px!important } .es-m-p10r { padding-right:10px!important } .es-m-p10l { padding-left:10px!important } .es-m-p15 { padding:15px!important } .es-m-p15t { padding-top:15px!important } .es-m-p15b { padding-bottom:15px!important } .es-m-p15r { padding-right:15px!important } .es-m-p15l { padding-left:15px!important } .es-m-p20 { padding:20px!important } .es-m-p20t { padding-top:20px!important } .es-m-p20r { padding-right:20px!important } .es-m-p20l { padding-left:20px!important } .es-m-p25 { padding:25px!important } .es-m-p25t { padding-top:25px!important } .es-m-p25b { padding-bottom:25px!important } .es-m-p25r { padding-right:25px!important } .es-m-p25l { padding-left:25px!important } .es-m-p30 { padding:30px!important } .es-m-p30t { padding-top:30px!important } .es-m-p30b { padding-bottom:30px!important } .es-m-p30r { padding-right:30px!important } .es-m-p30l { padding-left:30px!important } .es-m-p35 { padding:35px!important } .es-m-p35t { padding-top:35px!important } .es-m-p35b { padding-bottom:35px!important } .es-m-p35r { padding-right:35px!important } .es-m-p35l { padding-left:35px!important } .es-m-p40 { padding:40px!important } .es-m-p40t { padding-top:40px!important } .es-m-p40b { padding-bottom:40px!important } .es-m-p40r { padding-right:40px!important } .es-m-p40l { padding-left:40px!important } a.es-button, button.es-button { font-size:16px!important; display:block!important; border-left-width:0px!important; border-right-width:0px!important } }</style></head>
  <body style="width:100%;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div class="es-wrapper-color" style="background-color:#F8F9FD"> <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f8f9fd"></v:fill> </v:background><![endif]--><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top"><tr><td valign="top" style="padding:0;Margin:0"><table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr><td align="center" bgcolor="#071f4f" style="padding:0;Margin:0;background-color:#071F4F;background-image:url(https://nmfszx.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/10801592857268437.png);background-repeat:no-repeat;background-position:center top" background="https://nmfszx.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/10801592857268437.png"><table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"><tr><td align="left" style="Margin:0;padding-left:30px;padding-right:30px;padding-top:40px;padding-bottom:40px"><table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" style="padding:0;Margin:0;width:540px"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" height="20" style="padding:0;Margin:0"></td>
  </tr><tr><td align="left" style="padding:0;Margin:0;padding-bottom:10px"><h1 style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#FFFFFF;text-align:center">Revo Cases Admin</h1></td></tr><tr><td align="center" style="padding:0;Margin:0;font-size:0px"><img src="https://nmfszx.stripocdn.email/content/guids/CABINET_020fb19aeda51688864f9a6d2d91081c/images/66761613648785579.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="130"></td>
  </tr><tr><td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:16px;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;color:#FFFFFF">Use the button below to reset your password. This password reset expires after one use.</p></td></tr></table></td></tr></table></td></tr></table></td>
  </tr></table><table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr><td align="center" bgcolor="#0a2b6e" style="padding:0;Margin:0;background-color:#0A2B6E;background-image:url(https://nmfszx.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/33971592408649468.png);background-repeat:no-repeat;background-position:center center" background="https://nmfszx.stripocdn.email/content/guids/CABINET_1ce849b9d6fc2f13978e163ad3c663df/images/33971592408649468.png"><table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"><tr><td class="es-m-p40t es-m-p40b es-m-p20r es-m-p20l" align="left" style="padding:0;Margin:0;padding-top:40px;padding-bottom:40px"><table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" style="padding:0;Margin:0;width:600px"><table cellpadding="0" cellspacing="0" width="100%" bgcolor="#f0f3fe" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;background-color:#F0F3FE;border-radius:20px" role="presentation"><tr><td align="left" style="Margin:0;padding-bottom:10px;padding-left:20px;padding-right:20px;padding-top:25px"><h1 style="Margin:0;line-height:45px;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#212121;text-align:center">Click to reset password!</h1>
  </td></tr><tr><td align="center" style="padding:0;Margin:0"><span class="es-button-border es-button-border-2" style="border-style:solid;border-color:#2CB543;background:#DD5907;border-width:0px;display:inline-block;border-radius:32px;width:auto"><a href="${passwordResetLink}" class="es-button es-button-1" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;font-size:16px;color:#FFFFFF;border-style:solid;border-color:#DD5907;border-width:10px 20px;display:inline-block;background:#DD5907;border-radius:32px;font-weight:normal;font-style:normal;line-height:19px;width:auto;text-align:center">Reset Password</a></span></td></tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table></div></body></html>
  </td></tr><tr><td align="center" style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:24px;font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;line-height:36px;color:#FF6600"></p></td></tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table></div></body></html>
  `

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Revo Cases Admin👻" support@revo-cases.com',
    to: email,
    subject: "Revo Cases Password Reset",
    html: myHTML
  })

  console.log(info)
}

router.post('/signup', async (req, res) => {
  const username = req.body.username
  const email = req.body.email
  const password = req.body.password
  const tradeURL = req.body.tradeURL
  let referral = req.body.referral

  if (referral === null) {
    referral = null
  } else {
    referral= referral[0]
  }

  try {
    let emailTaken = await User.findOne({ email })
    let usernameTaken = await User.findOne({ username })

    if (usernameTaken) {
      return res.status(200).send('Username is taken.')
    }

    const emailVerificationCode = generator.generate({
      length: 10,
      numbers: true
    })

    if (!emailTaken) {
      const userForSave = new User({
        username,
        email,
        emailVerificationCode,
        password,
        tradeURL,
        referredTo: referral
      })

      const user = await userForSave.save()

      const token = await userForSave.generateAuthToken()

      sendConfirmationEmail(email, emailVerificationCode)

      return res.status(201).send({ user, token })
    } else {
      return res.status(200).send('E-mail is already used by another account.')
    }
  } catch(err) {
    return res.status(500).send(err)
  }
})

router.post('/resend-email-verification', auth, async(req, res) => {
  const user = req.user

  try {
    sendConfirmationEmail(user.email, user.emailVerificationCode)
    return res.status(200).send()
  } catch(err) {
    return res.status(400).send()
  }
})

router.post('/verify-email', auth, async (req, res) => {
  const user = req.user
  const verificationCode = req.body.emailVerificationCode

  console.log(verificationCode)
  console.log(user.emailVerificationCode)

  try {
    if (verificationCode === user.emailVerificationCode) {
      user.emailVerified = true

      await user.save()

      return res.status(200).send()
    } else {
      return res.status(400).send()
    }
  } catch(err) {
    return res.status(500).send()
  }
})

router.post('/finish-daily-ads', auth, async(req, res) => {
  const user = req.user

  try {
    user.boosterAdsFinishedAt = new Date()
    user.adsViewed += 50

    await user.save()

    return res.status(200).send()
  } catch(err) {
    log(err)
    return res.send(err)
  }
})

router.post('/login', async (req, res) => {
  const email = req.body.email
  const password = req.body.password

  console.log(email, password)

  try {
      const user = await User.findByCredentials(email, password)
      const token = await user.generateAuthToken()
      res.status(200).send({ user, token })
  } catch(err) {
      log(err)
      res.status(201).send({ message: 'Wrong e-mail or password!' }) 
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
  // const id = req.user._id

  const wpns = [
    'M4A1-S | Hyper Beast (Factory New)',
    'MAC-10 | Neon Rider (Factory New)',
    'Galil AR | Eco (Factory New)',
    'Five-SeveN | Monkey Business (Factory New)',
    'Famas | Djinn (Factory New)',
    'AWP | Worm God (Factory New)'
  ]

  try {
    // const user = await User.findOne({ uid }, `credits -_id`)

    let price
    price = await steamprice.getprices(730, wpns, '1')

    res.status(200).send(price)
  } catch(err) {
    res.status(400).send(err)
  }
})

router.get('/get-user-skins', auth, async(req, res) => {
  const id = req.user._id
  console.log(id)

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

const getWeapon = (caseName, fromGenerator, predefinedGrade, isYouTuber = false) => {
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
      ],
      exceedingly_rare: [
        'rare_item'
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
      ],
      exceedingly_rare: [
        'rare_item'
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
      ],
      exceedingly_rare: [
        'rare_item'
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
      ],
      exceedingly_rare: [
        'rare_item'
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
      ],
      exceedingly_rare: [
        'rare_item'
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
      ],
      exceedingly_rare: [
        'Rare Item'
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
        'Trigon',
        'Antique',
        'Redline',
      ],
      covert: [
        'Chameleon',
        'Asiimov'
      ],
      exceedingly_rare: [
        'Rare Item'
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
      ],
      exceedingly_rare: [
        'Rare Item'
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
      ],
      exceedingly_rare: [
        'Rare Item'
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
      ],
      exceedingly_rare: [
        'Rare Item'
      ]
    }
  }

  const gunConditions = {
    "ak-47_asiimov": ["bs"],
    "awp_neo-noir": ["bs"],
    "desert_eagle_mecha_industries": ["bs"],
    "mp5-sd_phosphor": ["bs"],
    "ump-45_momentum": ["ww"],
    "usp-s_flashback": ["ft"],
    "p250_nevermore": ["ft"],
    "galil_ar_signal": ["ft"],
    "mac-10_pipe_down": ["bs"],
    "g3sg1_scavenger": ["bs"],
    "m4a4_magnesium": ["bs"],
    "glock-18_oxide_blaze": ["ft"],
    "tec-9_fubar": ["ft"],
    "mp9_modest_threat": ["ft"],
    "sg553_danger_close": ["bs"],
    "sawed-off_black_sand": ["ft"],
    "nova_wood_fired": ["bs"],
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

  if (!predefinedGrade) {
    // Get Skin Grade
    skinGrade = Math.random() * 100
    skinGrade = Math.round(skinGrade * 100) / 100

    if (fromGenerator) {
      const getGrade = () => {
        if (skinGrade >= 0 && skinGrade < 0.3) return 'exceedingly_rare' 
        else if (skinGrade >= 0.3 && skinGrade < 1.50) return 'covert'
        else if (skinGrade >= 1.50 && skinGrade < 7.00) return 'classified'
        else if (skinGrade >= 7 && skinGrade < 20.00) return 'restricted'
        else if (skinGrade >= 20.00) return 'mil_spec'
      }
      skinGrade = getGrade()
    } else {
      let restrictedChance = 15

      if (isYouTuber) restrictedChance = 20

      const getGrade = () => {
        if (skinGrade < 0) return 'covert' 
        else if (skinGrade >= 0 && skinGrade < 2) return 'classified' 
        else if (skinGrade >= 2 && skinGrade < restrictedChance) return 'restricted'
        else if (skinGrade >= restrictedChance) return 'mil_spec'
      }
    
      skinGrade = getGrade()
    }
  } else {
    skinGrade = predefinedGrade
  }
  
  // Get Skin Condition
  // For Covert
  // if (skinGrade === 'covert') {
  //   skinCon = 'bs'
  // }
  // // For Classified
  // else if (skinGrade === 'classified') {
  //   const num = Math.round(skinCon * 100) / 100

  //   if (num < 15) {
  //     skinCon = 'ww'
  //   } else {
  //     skinCon = 'bs'
  //   }
  // }
  // // For below Classified shuffle condition normally
  // else {
  //   // Get Skin condition
  //   skinCon = Math.random() * 100
  //   skinCon = Math.round(skinCon * 100) / 100

  //   const getCondition = () => {
  //     if (skinCon <= 1) return 'fn'
  //     else if (skinCon >= 1 && skinCon < 7) return 'mw'
  //     else if (skinCon >= 7 && skinCon < 35) return 'ft'
  //     else if (skinCon >= 35 && skinCon < 70) return 'ww'
  //     else if (skinCon >= 70) return 'bs'
  //   }

  //   skinCon = getCondition()
  // }

  const arrLen = wpnCases[caseName][skinGrade].length
  const skinIndex = Math.floor(Math.random() * (arrLen - 0) + 0)

  const skin = wpnCases[caseName][skinGrade][skinIndex]
  const formattedSkin = formattedSkinName[caseName][skinGrade][skinIndex]

  if (fromGenerator) {
    const generatorSkinConditions = ['bs', 'ww', 'ft', 'mw', 'fn']

    skinCon = generatorSkinConditions[Math.floor(Math.random() * generatorSkinConditions.length)]
  } 
  else {
    skinCon = gunConditions[skin]

    if (skinCon[0] === '*') skinCon = ['bs', 'ww', 'ft', 'mw', 'fn']
  
    skinCon = skinCon[Math.floor(Math.random()*skinCon.length)]
  }

  return { formattedSkin, skin, skinGrade, skinCon }
}

router.post('/buy-case', auth, async(req, res) => {
  const id = req.user._id
  const caseName = req.body.caseName

  const cases = ['dangerZone', 'chroma2', 'clutch', 'fracture', 'phoenix']
  const casePrices = [149, 199, 249, 399, 599]

  const caseIndex = cases.indexOf(caseName)

  const user = await User.findById(id, `-_id  credits tradeURL referredTo`)
  const userCredits = user.credits
  const creditsRequired = casePrices[caseIndex]

  let skinGrade
  let skinCon

  let skin
  let formattedSkin
  if (userCredits >= creditsRequired) {
    const isYouTuber = user.accountType === 'youtuber'

    const data = getWeapon(caseName, false, null, isYouTuber)
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
            'rp': 1
          }
        })
      }

      if (user.referredTo) {
        await Giveaway.findByIdAndUpdate(giveawayDocID, {
          $push: {
            dailyUserPool: user.referredTo
          }
        })
      }

      updateCasesOpened(caseName, skinGrade)

      if (skinGrade === 'mil_spec') {
        req.user.blues += 1
      } else if (skinGrade === 'restricted') {
        req.user.purples += 1
      } else if (skinGrade === 'classified') {
        req.user.pinks += 1
      } else if (skinGrade === 'covert') {
        req.user.reds += 1
      } else if (skinGrade === 'exceedingly_rare') {
        req.user.yellows += 1
      }

      req.user.casesOpened += 1

      req.user.save()
    } catch(err) {
      return res.status(500).send(err)
    }
  } else {
    return res.status(400).send()
  }
  
  const readyDrop = {
    uname: req.user.username,
    skin: formattedSkin,
    longhand: skin, 
    grade: skinGrade, 
    condition: skinCon,
    timeOpened: Number(Date.now())
  }

  addSkinToLiveDrops(readyDrop)

  res.status(200).send({ skin: formattedSkin, skinLonghand: skin, skinGrade, skinCon })
})

router.get('/get-giveaway-data', auth, async(req, res) => {
  const user = req.user

  try {
    const giveaway = await Giveaway.findById(giveawayDocID)
    
    return res.status(200).send({ giveaway, rp: user.rp, tickets: user.tickets })
  } catch(err) {
    return res.status(400).send()
  }

})

router.get('/check-profitability', async(req, res) => {
  const powerSecret = req.body.powerSecret

  if (powerSecret !== process.env.FETCH_SKINS_SECRET) {
    return res.status(401).send()
  }

  const casePrice = 0.3

  let skinPrices = 0
  let caseIncome = 0
  let casesOpened = 0

  const amountOfDrops = 100000

  const shorthandCondition = ['fn', 'mw', 'ft', 'ww', 'bs']
  const conditions = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred']

  const skins = [
    "ak-47_asiimov",
    "awp_neo-noir",
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
    "AK-47 | Asiimov",
    "AWP | Neo-Noir",
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
    "AK-47 | Asiimov (Battle-Scarred)": 21.83,
    "AK-47 | Asiimov (Well-Worn)": 21.83,
    "AWP | Neo-Noir (Well-Worn)": 22.90,
    "AWP | Neo-Noir (Battle-Scarred)": 22.90,

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
  
  let pricesBlue = 0
  let pricesPurple = 0
  let pricesPink = 0
  let pricesPurpleAndPink = 0
  let pricesRed = 0

  let i
  for (i = 0; i < amountOfDrops; i++) {
    let data = getWeapon('dangerZone', false)

    skin = data.skin
    skinCon = data.skinCon

    const conIndex = shorthandCondition.indexOf(skinCon)
    skinCon = conditions[conIndex] 

    const skinIndex = skins.indexOf(skin)
    skin = skinsFormatted[skinIndex]

    const query = `${skin} (${skinCon})`
    // log(`${query} ${pricesOfSkins[query]}`)

    price = pricesOfSkins[query]
    
    const num = Math.floor(Math.random() * 100)
    if (num <= 40 && data.skinGrade === 'mil_spec') {
      skinPrices += price
      pricesBlue += price
    }

    if (data.skinGrade !== 'mil_spec') {
      skinPrices += price
      pricesPurpleAndPink += price
      if (data.skinGrade === 'restricted') {
        pricesPurple += price
      } else if (data.skinGrade === 'classified') {
        pricesPink += price
      } else if (data.skinGrade === 'covert') {
        pricesRed += price
      }
    }

    casesOpened++
  }

  caseIncome = casePrice * amountOfDrops

  return res.status(200).send({
    pricesBlue,
    pricesPurple,
    pricesPink,
    pricesPurpleAndPink,
    pricesRed,
    brojOtvorenihKutija: casesOpened,
    cijenaJedneKutijeKodNas: casePrice,
    sveukupnaZaradaOdProdavanjaKutijaEUR: caseIncome,
    sveukupnoIsplacenoSkinovaEUR: skinPrices,
    profitEUR: caseIncome - skinPrices,
    profitPerc: ((caseIncome - skinPrices) / caseIncome) * 100 + ' %'
  })
})

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

function normalizeSkinName(skinName) {
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

  return `${skins[skinName]}`
}

function normalizeCondition(condition) {
  // condition
  const conditions = {
    "fn": "Factory New",
    "mw": "Minimal Wear",
    "ft": "Field-Tested",
    "ww": "Well-Worn",
    "bs": "Battle-Scarred"
  }

  return conditions[condition]
}

router.get('/view-trade-requests', auth, async(req, res) => {
  if (req.user.accountType !== 'admin') {
    return res.status(401).send()
  }

  try {
    let skins = await Skin.find({ requestedTrade: true, tradeOfferSent: false },
      `_id skin grade condition userID tradeRequestedAt tradeOfferSent`)

    // Sort skins by oldest DateTime
    skins.sort(function(a, b){
      return new Date(a.tradeRequestedAt) - new Date(b.tradeRequestedAt)
    })

    function openedAgo(timestamp) {
      return moment(timestamp).fromNow()
    }

    const giveaway = await Giveaway.findById(giveawayDocID,
      `-_id currentDailyWinner currentWeeklyWinner`)

    console.log(giveaway)
    const dailyWinnerTradeURL = await User.findOne(
      { username: giveaway.currentDailyWinner }, `-_id tradeURL`)

    const weeklyWinnerTradeURL = await User.findOne(
      { username: giveaway.currentWeeklyWinner }, `-_id tradeURL`)

    const giveawayData = {
      currentDailyWinner: {
        username: giveaway.currentDailyWinner,
        tradeURL: dailyWinnerTradeURL
      },
      currentWeeklyWinner: {
        username: giveaway.currentWeeklyWinner,
        tradeURL: weeklyWinnerTradeURL
      }
    }

    let tradeRequests = []
    await Promise.all(skins.map(async (skin) => {
      const user = await User.findById(skin.userID, `-_id username tradeURL`)

      let normalizedSkinName = normalizeSkinName(skin.skin)

      let tradeRequest = {
        skinID: skin._id,
        username: user.username,
        skinName: normalizedSkinName,
        grade: skin.grade,
        condition: skin.condition,
        tradeURL: user.tradeURL,
        tradeOfferSent: skin.tradeOfferSent,
        tradeRequestedAt: openedAgo(skin.tradeRequestedAt)
      }
      
      tradeRequests.push(tradeRequest)
    }))

    return res.status(200).send({ tradeRequests, giveawayData })
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

router.post('/finish-trade-offer', auth, async(req, res) => {
  const user = req.user
  const skinID = req.body.skinID

  if (user.accountType !== 'admin') {
    return res.status(401).send()
  }

  try {
    await Skin.findByIdAndUpdate(skinID, {
      tradeOfferSent: true
    })

    return res.status(200).send()
  } catch(err) {
    return res.status(400).send()
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
        "ft": 1450,
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

router.post('/trade-up', auth, async(req, res) => {
  const user = req.user
  const skinIDs = req.body.skinIDs

  try {

    await Promise.all(skinIDs.map(async (skinID) => {
      if (!user.skins.includes(skinID)) {
        return res.status(400).send()
      }
    }))

    const data = await Skin.findById(skinIDs[0], `grade -_id`)
    let grade = data.grade

    if (grade === 'mil_spec') grade = 'restricted'
    else if (grade === 'restricted') grade === 'classified'
    else if (grade === 'classified') grade === 'covert'
    else if (grade === 'covert') grade === 'exceedingly_rare'

    const cases = ['dangerZone', 'chroma2', 'clutch']
    const randomCase = cases[Math.floor(Math.random() * cases.length)];

    let skinDrop = getWeapon(randomCase, false, grade)

    await Promise.all(skinIDs.map(async (skinID) => {
      Skin.findByIdAndDelete(skinID)
    }))

    const skinForSave = new Skin({
      userID: user._id,
      skin: skinDrop.skin,
      grade: skinDrop.skinGrade,
      condition: skinDrop.skinCon,
      caseName: randomCase
    })

    const savedSkin = await skinForSave.save()

    user.skins = user.skins.filter(skinID => {
      if (skinIDs.includes(skinID) === false) {
        return skinID
      }
    })

    user.skins.unshift(savedSkin._id)

    await user.save()

    res.status(200).send(savedSkin)

  } catch(err) {
    res.status(400).send()
  }
})

router.post('/give-user-points', async(req, res) => {
  const username = req.header('Authorization')
  
  try {
    const user = await User.findOne({ username })

    const a = moment(new Date())
    const b = moment(user.boosterAdsFinishedAt)

    const hourDiff = a.diff(b, 'hours')

    if (hourDiff < 24) {
      user.credits += 5
    } else {
      user.credits += 3
    }

    await user.save()

    return res.status(200).send(user.credits)
  } catch (error) {
    return res.status(400).send()
  }
  
})

router.post('/open-daily-reward', auth, async(req, res) => {
  const user = req.user

  // Drop
  let num = Math.random() * 100
  num = Math.round(num * 100) / 100

  const getDrop = () => {
    if (num >= 0 && num < 0.35) return 50 
    else if (num >= 0.35 && num < 0.95) return 20 
    else if (num >= 0.95 && num < 4.15) return 15 
    else if (num >= 4.15 && num < 20.00) return 10
    else if (num >= 20.00) return 5
  }

  const drop = getDrop()

  user.credits += drop
  user.dailyRewardOpened = new Date()

  let a = moment(new Date())
  let b = moment(user.dailyRewardOpened)

  let hourDiff = a.diff(b, 'hours')

  if (hourDiff >= 24) {
    return res.status(400).send()
  }

  try {
    await user.save()
    
    return res.status(200).send(String(drop))
  } catch(err) {
    return res.status(400).send()
  }
})

router.post('/send-password-reset', async(req, res) => {
  const email = req.body.forEmail

  try {
    const emailExists = await User.findOne({ email })

    if (emailExists) {
      const generatedSafeCode = generator.generate({
        length: 15,
        numbers: true
      })
  
      const passwordReset = new PasswordReset({
        forEmail: email,
        safeCode: generatedSafeCode
      })

      await passwordReset.save()

      console.log(passwordReset)

      await sendPasswordReset(email, generatedSafeCode)
    }

    return res.status(200).send()
  } catch(err) {
    return res.status(500).send()
  }
})

router.post('/update-password', async(req, res) => {
  const safeCode = req.body.safeCode
  const newPassword = req.body.newPassword

  try {
    let passwordReset = await PasswordReset.findOne({ safeCode }, `_id forEmail expired`)
   
    if (!passwordReset.expired) {
      let user = await User.findOne({ email: passwordReset.forEmail })
    
      passwordReset.expired = true
  
      await passwordReset.save()
  
      user.password = newPassword
  
      await user.save()

      return res.status(200).send()
    } else {
      return res.status(400).send()
    }
  } catch(err) {
    console.log(err)
    res.status(500).send()
  }
})

module.exports = router