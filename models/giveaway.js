const mongoose = require('mongoose')

const giveawaySchema = new mongoose.Schema({
  // Same as weekly ticket, only with RP
  dailyUserPool: {
    type: Array,
    default: []
  },
  /*
    Each bought ticket's username gets added
    to this array, then one is picked and it's emptied again.
  */
  weeklyUserPool: {
    type: Array,
    default: []
  },
  currentDailyWinner: {
    type: String,
    required: false
  },
  currentWeeklyWinner: {
    type: String,
    required: false
  }
})

const Giveaway = mongoose.model('Giveaway', giveawaySchema)

module.exports = Giveaway