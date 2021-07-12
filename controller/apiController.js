const db = require('../models')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const Followship = db.Followship
const Reply = db.Reply
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

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
  },

  getUser: async (req, res) => {
    try {
      const { userId } = req.params
      const user = await User.findByPk(userId, { attributes: ['id', 'cover', 'avatar', 'name', 'introduction'] })
      return res.json(user.toJSON())
    } catch (err) {
      return console.warn(err)
    }
  },

  postUser: async (req, res) => {
    try {
      const { userId } = req.params
      const { name, introduction, avatar, cover } = req.body
      if (!name) {
        //req.flash('error_message', 'errors')
        return res.redirect(`/users/${userId}/tweets`)
      }
      const { file } = req
      if (file) {
        imgur.setClientID(IMGUR_CLIENT_ID);
        imgur.upload(file.path, async (err, img) => {
          const user = await User.findByPk(userId)
          await user.update({
            name: name,
            introduction: introduction,
            avatar: avatar,
            cover: cover,
            image: file ? img.data.link : restaurant.image,
          })
          return callback({ status: 'success', message: 'restaurant was successfully updated' })
        })
      }

    } catch (err) {
      return console.warn(err)
    }
  }
}
module.exports = apiController