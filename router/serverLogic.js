const express = require('express')
const auth = require('../middleware/auth')
const firebase = require('firebase')
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

require('firebase/firestore')

firebase.initializeApp({ 
  apiKey: "AIzaSyDMWb56THHAiz7jqRT2dyDbIq2R3ux3Mp0",
  authDomain: "revo-skins.firebaseapp.com",
  projectId: "revo-skins",
  storageBucket: "revo-skins.appspot.com",
  messagingSenderId: "850588837597",
  appId: "1:850588837597:web:ef961e5390f73558241d34",
  measurementId: "G-G43NV0CTSV"
})

const firestore = firebase.firestore()

const giveawayDocID = '602bb5f27d5b6c0c10d3b04b'

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

const skinGradesOpenedRef = firestore.collection('skinGradesOpened')
let skinGradesOpened = [0, 0, 0, 0, 0]
skinGradesOpenedRef.onSnapshot((snap) => {
  snap.docs.forEach(doc => {
    skinGradesOpened[0] = doc.data().blue
    skinGradesOpened[1] = doc.data().purple
    skinGradesOpened[2] = doc.data().pink
    skinGradesOpened[3] = doc.data().gold
  })
})

const casesOpenedRef = firestore.collection('casesOpened')
let casesOpened = [0, 0, 0, 0, 0]
casesOpenedRef.onSnapshot((snap) => {
  snap.docs.forEach(doc => {
    casesOpened[0] = doc.data().fire
    casesOpened[1] = doc.data().lambda
    casesOpened[2] = doc.data().oldschool
    casesOpened[3] = doc.data().goldenLambda
    casesOpened[4] = doc.data().nuclear
  })
})

function updateCasesOpened(caseName, grade) {
  const docRef = firestore.collection("casesOpened").doc('ZiXgrpmWCfUiEy6t3Hfw')
  const docSkinGrades = firestore.collection("skinGradesOpened").doc('rmHWnoBk97YLUf6GRQbl')

  if (caseName === 'fire') {
      docRef.update({
        fire: casesOpened[0] + 1
    })
  }

  else if (caseName === 'lambda') {
      docRef.update({
        lambda: casesOpened[1] + 1
    })
  }

  else if (caseName === 'oldschool') {
    docRef.update({
      oldschool: casesOpened[2] + 1
    })
  }

  else if (caseName === 'goldenLambda') {
    docRef.update({
      goldenLambda: casesOpened[3] + 1
    })
  }

  else if (caseName === 'nuclear') {
      docRef.update({
        nuclear: casesOpened[4] + 1
    })
  }

  switch (grade) {
    case 'blue':
      docSkinGrades.update({
        blue: skinGradesOpened[0] + 1
      })
      break;
    case 'purple':
      docSkinGrades.update({
        purple: skinGradesOpened[1] + 1
      })
      break;
    case 'pink':
      docSkinGrades.update({
        pink: skinGradesOpened[2] + 1
      })
      break;
    case 'gold':
      docSkinGrades.update({
        gold: skinGradesOpened[3] + 1
      })
      break;
    default:
      break;
  }
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

function addSkinToLiveDrops(skin) {
  firestore.collection("drops").add(skin)
}

// Live Drops
let interval = Math.floor(Math.random() * (90000 - (100 * getHour())))

const iterator = () => {
  // Choose Case
  let caseName = Math.random() * 100
  caseName = Math.round(caseName * 100) / 100

  const chooseCase = () => {
    if (caseName >= 0 && caseName < 30) return 'nuclear' 
    else if (caseName >= 30 && caseName < 75.00) return 'goldenLambda'
    else if (caseName >= 75.00 && caseName < 86.00) return 'oldschool'
    else if (caseName >= 86.00 && caseName < 93.00) return 'lambda'
    else if (caseName > 93.00) return 'fire'
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

  const passwordResetLink = `https://revo-cases.com/?safecode=${safeCode}`

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

const getWeapon = (caseName, fromGenerator, predefinedGrade, isYouTuber = false) => {
  const wpnCases = {
    fire: {
      blue: [
        "xm1014_oxide_blaze",
        "mp9_black_sand",
        "r8_revolver_grip"
      ],
      purple: [
        "ak-47_safari_mesh",
        "cz75-auto_pole_position",
        "cz75-auto_imprint",
        "five-seven_flame_test"
      ],
      pink: [
        "ak-47_uncharted",
        "desert_eagle_corinthian",
        "usp-s_lead_conduit"
      ],
      gold: [
        "usp-s_flashback",
        "m4a1-s_nitro"
      ]
    },
    lambda: {
      blue: [
        "mp7_armor_core",
        "sg_553_danger_close",
        "mp9_modest_threat"
      ],
      purple: [
        "mac-10_pipe_down",
        "desert_eagle_oxide_blaze",
        "sg_553_phantom",
        "p250_inferno"
      ],
      pink: [
        "m4a1-s_basilisk",
        "desert_eagle_naga",
        "ak-47_elite_build"
      ],
      gold: [
        "famas_styx",
        "m4a4_evil_daimyo"
      ]
    },
    oldschool: {
      blue: [
        "tec-9_fubar",
        "p250_cassette",
        "mag-7_heaven_guard"
      ],
      purple: [
        "desert_eagle_the_bronze",
        "mag-7_swag-7",
        "ak-47_safari_mesh",
        "m4a4_magnesium"
      ],
      pink: [
        "famas_valence",
        "ssg_08_parallax",
        "desert_eagle_meteorite"
      ],
      gold: [
        "usp-s_cyrex",
        "ak-47_elite_build"
      ]
    },
    goldenLambda: {
      blue: [
        "mp7_armor_core",
        "sg_553_danger_close",
        "mp9_modest_threat"
      ],
      purple: [
        "mac-10_pipe_down",
        "desert_eagle_oxide_blaze",
        "sg_553_phantom",
        "p250_inferno"
      ],
      pink: [
        "m4a1-s_basilisk",
        "desert_eagle_naga",
        "ak-47_elite_build"
      ],
      gold: [
        "famas_styx",
        "m4a4_evil_daimyo"
      ]
    },
    nuclear: {
      blue: [
        "famas_decommissioned",
        "glock-18_oxide_blaze",
        "sg_553_ol'_rusty"
      ],
      purple: [
        "desert_eagle_directive",
        "p250_nevermore",
        "m4a1-s_flashback",
        "sg_553_darkwing"
      ],
      pink: [
        "awp_atheris",
        "famas_djinn",
        "awp_mortis"
      ],
      gold: [
        "usp-s_mashup",
        "m4a4_cyber_security"
      ]
    }
  }

  const formattedSkinName = {
    fire: {
      blue: [
        "Oxide Blaze",
        "Black Sand",
        "Grip"
      ],
      purple: [
        "Safari Mesh",
        "Pole Position",
        "Imprint",
        "Flame Test"
      ],
      pink: [
        "Uncharted",
        "Corinthian",
        "Lead Conduit"
      ],
      gold: [
        "Flashback",
        "Nitro"
      ]
    },
    lambda: {
      blue: [
        "Wood Fired",
        "Freight",
        "Ultralight"
      ],
      purple: [
        "Safari Mesh",
        "Blue Ply",
        "Bronze Deco",
        "Magnesium"
      ],
      pink: [
        "Light Rail",
        "PAW",
        "Guardian"
      ],
      gold: [
        "Exoskeleton",
        "Phobos"
      ]
    },
    oldschool: {
      blue: [
        "Fubar",
        "Cassette",
        "Heaven Guard"
      ],
      purple: [
        "The Bronze",
        "SWAG-7",
        "Safari Mesh",
        "Magnesium",
      ],
      pink: [
        "Valence",
        "Parallax",
        "Meteorite"
      ],
      gold: [
        "Cyrex",
        "Elite Build"
      ]
    },
    goldenLambda: {
      blue: [
        "Armor Core",
        "Danger Close",
        "Modest Threat"
      ],
      purple: [
        "Pipe Down",
        "Oxide Blaze",
        "Phantom",
        "Inferno"
      ],
      pink: [
        "Basilisk",
        "Naga",
        "Elite Build"
      ],
      gold: [
        "Styx",
        "Evil Daimyo"
      ]
    },
    nuclear: {
      blue: [
        "Decommissioned",
        "Oxide Blaze",
        "Ol' Rusty"
      ],
      purple: [
        "Directive",
        "Nevermore",
        "Flashback",
        "Darkwing"
      ],
      pink: [
        "Atheris",
        "Djinn",
        "Mortis"
      ],
      gold: [
        "Mashup",
        "Cyber Security"
      ]
    }
  }

  const gunConditions = {
    // Fire
    "r8_revolver_grip": ["*"],
    "mp9_black_sand": ["*"],
    "xm1014_oxide_blaze": ["*"],
    "five-seven_flame_test": ["ft"],
    "cz75-auto_imprint": ["ft"],
    "cz75-auto_pole_position": ["ft"],
    "ak-47_safari_mesh": ["ft"],
    "usp-s_lead_conduit": ["ww"],
    "desert_eagle_corinthian": ["ft"],
    "ak-47_uncharted": ["ft"],
    "m4a1-s_nitro": ["ft"],
    "usp-s_flashback": ["ft"],
    // Lambda
    "negev_ultralight": ["*"],
    "p90_freight": ["*"],
    "nova_wood_fired": ["*"],
    "m4a4_magnesium": ["ww"],
    "desert_eagle_the_bronze": ["mw"],
    "desert_eagle_blue_ply": ["ww"],
    "awp_safari_mesh": ["ft"],
    "usp-s_guardian": ["ft"],
    "awp_paw": ["ft"],
    "desert_eagle_light_rail": ["ft"],
    "awp_phobos": ["ft"],
    "awp_exoskeleton": ["ww"],
    // Oldschool
    "mag-7_heaven_guard": ["*"],
    "p250_cassette": ["*"],
    "tec-9_fubar": ["*"],
    "m4a4_magnesium": ["ww"],
    "ak-47_safari_mesh": ["ft"],
    "mag-7_swag-7": ["ft"],
    "desert_eagle_the_bronze": ["mw"],
    "desert_eagle_meteorite": ["ft"],
    "ssg_08_parallax": ["ww"],
    "famas_valence": ["ft"],
    "ak-47_elite_build": ["bs"],
    "usp-s_cyrex": ["ft"],
    // Golden Lambda
    "mp9_modest_threat": ["*"],
    "sg_553_danger_close": ["*"],
    "mp7_armor_core": ["*"],
    "p250_inferno": ["bs"],
    "sg_553_phantom": ["ft"],
    "desert_eagle_oxide_blaze": ["ft"],
    "mac-10_pipe_down": ["ft"],
    "ak-47_elite_build": ["bs"],
    "desert_eagle_naga": ["ft"],
    "m4a1-s_basilisk": ["ft"],
    "m4a4_evil_daimyo": ["ft"],
    "famas_styx": ["ww"],
    // Nuclear
    "sg_553_ol'_rusty": ["*"],
    "glock-18_oxide_blaze": ["*"],
    "famas_decommissioned": ["*"],
    "sg_553_darkwing": ["ww"],
    "m4a1-s_flashback": ["ww"],
    "p250_nevermore": ["ft"],
    "desert_eagle_directive": ["ft"],
    "awp_mortis": ["ft"],
    "famas_djinn": ["ww"],
    "awp_atheris": ["bs"],
    "m4a4_cyber_security": ["bs"],
    "usp-s_mashup": ["bs"]
  }

  let skinGrade
  let skinCon

  if (!predefinedGrade) {
    // Get Skin Grade
    skinGrade = Math.random() * 100
    skinGrade = Math.round(skinGrade * 100) / 100

    if (fromGenerator) {
      const getGrade = () => {
        if (skinGrade >= 0 && skinGrade <= 1) return 'gold'
        else if (skinGrade > 1 && skinGrade <= 5.00) return 'pink'
        else if (skinGrade > 5 && skinGrade <= 30.00) return 'purple'
        else if (skinGrade > 30.00) return 'blue'
      }
      skinGrade = getGrade()
    } else {
      let purpleChance = 20
      let pinkChance = 2

      if (isYouTuber) {
        pinkChance = 5
        purpleChance = 25
      }

      const getGrade = () => {
        if (skinGrade >= 0 && skinGrade <= 0.1) return 'gold' 
        else if (skinGrade > 0.1 && skinGrade <= pinkChance) return 'pink' 
        else if (skinGrade > pinkChance && skinGrade <= purpleChance) return 'purple'
        else if (skinGrade > purpleChance) return 'blue'
      }
    
      skinGrade = getGrade()
    }
  } else {
    skinGrade = predefinedGrade
  }

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

router.get('/get-user', auth, async(req, res) => {
  return res.status(200).send(req.user)
})

router.post('/signup', async (req, res) => {
  const username = req.body.username
  const email = req.body.email
  const password = req.body.password
  const tradeURL = req.body.tradeURL
  const location = req.body.location
  let referral = req.body.referral

  if (referral == null) {
    referral = null
  } else {
    referral = referral[0]
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
        location,
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

  console.log(user.boosterAdsFinishedAt)

  if (user.boosterAdsFinishedAt) {
    const a = moment(new Date())
    const b = moment(user.boosterAdsFinishedAt)

    const hourDiff = a.diff(b, 'hours')
    if (hourDiff < 24) {
      return res.status(400).send()
    }
  }

  try {
    user.boosterAdsFinishedAt = new Date()
    user.adsViewed += 50
    user.credits += 25

    await user.save()

    return res.status(200).send()
  } catch(err) {
    log(err)
    return res.status(400).send(err)
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

router.post('/buy-case', auth, async(req, res) => {
  const id = req.user._id
  const caseName = req.body.caseName

  const cases = ['fire', 'lambda', 'oldschool', 'goldenLambda', 'nuclear']
  let casePrices = [125, 149, 199, 299, 399]

  const ccCasePrices = [
    [599, 799, 1199, 1799, 2099],
    [299, 345, 599, 899, 1099],
    [249, 299, 399, 599, 799],
    [199, 279, 449, 599, 699],
    [149, 199, 249, 349, 449]
  ]

  const countryCodes = [
    ['XK', 'SY'],
    ['IQ', 'BA', 'PA', 'LY', 'DZ', 'ME', 'MK', 'AL'],
    ['RS', 'LB', 'MD', 'GS', 'JO', 'MO', 'EG', 'BY'],
    ['BG', 'UA'],
    ['HR', 'CY', 'LV', 'LT', 'TR', 'SI', 'RO']
  ]

  const userLoc = req.user.location

  if (userLoc) {
    let i
    for (i = 0; i < 5; i++) {
      if (countryCodes[i].includes(userLoc)) {
        casePrices = ccCasePrices[i]
      }
    }
  }

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

      if (skinGrade === 'blue') {
        req.user.blues += 1
      } else if (skinGrade === 'purple') {
        req.user.purples += 1
      } else if (skinGrade === 'pink') {
        req.user.pinks += 1
      } else if (skinGrade === 'gold') {
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

router.get('/check-new-profitability', async(req, res) => {
  const caseName = 'fire'
  const casePrice = 0.1
  const amountOfDrops = 30000

  const skinPrices = {
    fire: {
      purple: [0.07, 0.07, 0.3, 0.2],
      pink: [0.7, 0.7, 0.45],
      gold: [0.75, 0.75]
    },
    lambda: {
      purple: [0.1, 0.2, 0.2, 0.15],
      pink: [0.9, 1.3, 1.2],
      gold: [1.5, 1.2]
    },
    oldschool: {
      purple: [0.2, 0.35, 0.2, 0.15],
      pink: [1.3, 0.55, 0.85],
      gold: [1.5, 1.4]
    },
    goldenLambda: {
      purple: [0.35, 0.2, 0.35, 0.35],
      pink: [1.5, 1.1, 1.4],
      gold: [2, 3]
    },
    nuclear: {
      purple: [0.4, 0.45, 0.65, 0.45],
      pink: [1.65, 1.65, 2.2],
      gold: [4.3, 3.7]
    }
  }

  let skinCosts = 0
  let caseIncome = 0

  let skinGrade

  let blueCount = 0
  let purpleCount = 0
  let pinkCount = 0
  let goldCount = 0

  let purpleCosts = 0
  let pinkCosts = 0
  let goldCosts = 0

  let i
  for (i = 0; i < amountOfDrops; i++) {
    skinGrade = Math.random() * 100
    skinGrade = Math.round(skinGrade * 100) / 100
    const getGrade = () => {
      if (skinGrade <= 0.1) {
        goldCount++
        return 'gold'
      }
      else if (skinGrade > 0.1 && skinGrade <= 2.0) {
        pinkCount++
        return 'pink'
      }
      else if (skinGrade > 2.0 && skinGrade <= 20.0) {
        purpleCount++
        return 'purple'
      }
      else if (skinGrade > 20.0) {
        blueCount++
        return 'blue'
      }
    }

    skinGrade = getGrade()

    if (skinGrade !== 'blue') {
      let pricesForColor = skinPrices[caseName][skinGrade]

      let price = pricesForColor[Math.floor(Math.random() * pricesForColor.length)]
      skinCosts += price

      if (skinGrade === 'purple') purpleCosts += price
      else if (skinGrade === 'pink') pinkCosts += price
      else if (skinGrade === 'gold') goldCosts += price
    }
  }

  let gi
  for (gi = 0; gi < (blueCount / 10); gi++) {
    const cases = ['fire', 'lambda', 'oldschool']
    let randomCase = cases[Math.floor(Math.random() * cases.length)]

    let priceRange = skinPrices[randomCase]['purple']
    let costFromTradeUp = priceRange[Math.floor(Math.random() * priceRange.length)]

    skinCosts += costFromTradeUp
    purpleCosts += costFromTradeUp

    purpleCount++
  }

  caseIncome = amountOfDrops * casePrice

  return res.status(200).send({
    blueCount,
    purpleCount,
    pinkCount,
    goldCount,
    purpleCosts: Math.round(purpleCosts) + ' €',
    pinkCosts: Math.round(pinkCosts) + ' €',
    goldCosts: Math.round(goldCosts) + ' €',
    brojOtvorenihKutija: amountOfDrops,
    cijenaJedneKutijeKodNas: casePrice + ' €',
    sveukupnaZaradaOdProdavanjaKutijaEUR: Math.round(caseIncome) + ' €',
    sveukupnoIsplacenoSkinovaEUR: Math.round(skinCosts) + ' €',
    profitEUR: Math.round(caseIncome - skinCosts) + ' €',
    profitPerc: Math.round(((caseIncome - skinCosts) / caseIncome) * 100) + ' %'
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
    "sg_553_aloha": "SG 553 | Aloha",
    "p2000_urban_hazard": "P2000 | Urban Hazard",
    "pp-bizon_night_riot": "PP-Bizon | Night Riot",
    "m4a1-s_nitro": "M4A1-S | Nitro",
    "ak-47_uncharted": "AK-47 | Uncharted",
    "desert_eagle_corinthian": "Desert Eagle | Corinthian",
    "usp-s_lead_conduit": "USP-S | Lead Conduit",
    "ak-47_safari_mesh": "AK-47 | Safari Mesh",
    "cz75-auto_pole_position": "CZ75-Auto | Pole Position",
    "cz75-auto_imprint": "CZ75-Auto | Imprint",
    "five-seven_flame_test": "Five-SeveN | Flame Test",
    "xm1014_oxide_blaze": "XM1014 | Oxide Blaze",
    "mp9_black_sand": "MP9 | Black Sand",
    "r8_revolver_grip":"R8 Revolver | Grip",
    "famas_styx": "Famas | Styx",
    "m4a4_evil_daimyo": "M4A4 | Evil Daimyo",
    "m4a1-s_basilisk": "M4A1-S | Basilisk",
    "desert_eagle_naga": "Desert Eagle | Naga",
    "desert_eagle_oxide_blaze": "Desert Eagle | Oxide Blaze",
    "sg_553_phantom": "SG 553 | Phantom",
    "p250_inferno": "P250 | Inferno",
    "sg_553_danger_close": "SG 553 | Danger Close",
    "awp_exoskeleton": "AWP | Exoskeleton",
    "awp_phobos": "AWP | Phobos",
    "desert_eagle_light_rail": "Desert Eagle | Light Rail",
    "awp_paw": "AWP | PAW",
    "awp_safari_mesh": "AWP | Safari Mesh",
    "desert_eagle_blue_ply": "Desert Eagle | Blue Ply",
    "usp-s_mashup": "USP-S | Mashup",
    "m4a4_cyber_security": "M4A4 | Cyber Security",
    "awp_atheris": "AWP | Atheris",
    "desert_eagle_directive": "Desert Eagle | Directive",
    "m4a1-s_flashback": "M4A1-S | Flashback",
    "sg_553_darkwing": "SG 553 | Darkwing",
    "famas_decommissioned": "Famas | Decommissioned",
    "sg_553_ol'_rusty": "SG 553 | Ol' Rusty",
    "usp-s_cyrex": "USP-S | Cyrex",
    "famas_valence": "Famas | Valence",
    "ssg_08_parallax": "SSG 08 | Parallax",
    "desert_eagle_meteorite": "Desert Eagle | Meteorite",
    "desert_eagle_the_bronze": "Desert Eagle | The Bronze"
  }

  return `${skins[skinName]}`
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
    "fire": {
      "blue": {
        "fn": 8,
        "mw": 6,
        "ft": 5,
        "ww": 4,
        "bs": 3
      },
      "purple": {
        "fn": 40,
        "mw": 30,
        "ft": 20,
        "ww": 15,
        "bs": 12
      },
      "pink": {
        "ft": 450,
        "ww": 350,
        "bs": 300
      },
      "gold": {
        "ft": 1000,
        "ww": 900,
        "bs": 800
      }
    },
    "lambda": {
      "blue": {
        "fn": 10,
        "mw": 8,
        "ft": 6,
        "ww": 5,
        "bs": 4
      },
      "purple": {
        "fn": 45,
        "mw": 35,
        "ft": 25,
        "ww": 20,
        "bs": 15
      },
      "pink": {
        "ft": 500,
        "ww": 400,
        "bs": 350
      },
      "gold": {
        "ft": 1100,
        "ww": 1000,
        "bs": 900
      }
    },
    "oldschool": {
      "blue": {
        "fn": 15,
        "mw": 10,
        "ft": 8,
        "ww": 6,
        "bs": 4
      },
      "purple": {
        "fn": 100,
        "mw": 70,
        "ft": 60,
        "ww": 50,
        "bs": 40
      },
      "pink": {
        "ft": 600,
        "ww": 500,
        "bs": 400
      },
      "gold": {
        "ft": 1500,
        "ww": 1200,
        "bs": 1000
      }
    },
    "goldenLambda": {
      "blue": {
        "fn": 25,
        "mw": 20,
        "ft": 12,
        "ww": 11,
        "bs": 10
      },
      "purple": {
        "fn": 150,
        "mw": 120,
        "ft": 100,
        "ww": 80,
        "bs": 65
      },
      "pink": {
        "ft": 800,
        "ww": 600,
        "bs": 500
      },
      "gold": {
        "ft": 2000,
        "ww": 1500,
        "bs": 1200
      }
    },
    "nuclear": {
      "blue": {
        "fn": 30,
        "mw": 20,
        "ft": 15,
        "ww": 12,
        "bs": 10
      },
      "purple": {
        "fn": 200,
        "mw": 180,
        "ft": 150,
        "ww": 100,
        "bs": 80
      },
      "pink": {
        "ft": 1000,
        "ww": 800,
        "bs": 600
      },
      "gold": {
        "ft": 2500,
        "ww": 2000,
        "bs": 1500
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

    if (grade === 'blue') grade = 'purple'
    else if (grade === 'purple') grade === 'pink'
    else if (grade === 'pink') grade === 'gold'

    const cases = ['fire', 'lambda']
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
      user.credits += 10
    } else {
      user.credits += 5
    }

    user.gAdsViewed += 5

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

      return res.status(200).send({ msg: 'ok' })
    } else {
      return res.status(400).send({ msg: 'expired' })
    }
  } catch(err) {
    res.status(500).send({ msg: 'network_error' })
  }
})

module.exports = router