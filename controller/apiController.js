const db = require('../models')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const Followship = db.Followship
const Reply = db.Reply

const apiController = {
  getTweet: async (req, res) => {
    try {
      const { tweetId } = req.params
      const tweet = await Tweet.findByPk(tweetId, {
        include: [
          { model: User, attributes: ['id', 'avatar', 'name', 'account'] }
        ]
      })
      return res.json(tweet.toJSON())
    } catch (err) {
      return console.warn(err)
    }
  }
}
module.exports = apiController