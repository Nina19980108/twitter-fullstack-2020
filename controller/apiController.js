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
      // permission deny
      if (Number(userId) !== req.user.id) {
        //req.flash('error_message', 'errors')
        return res.redirect(`/users/${userId}/tweets`)
      }
      const { name, introduction } = req.body
      const { files } = req
      const { cover, avatar } = files
      // 名稱驗證
      if (!name) {
        //req.flash('error_message', 'name is required')
        return res.redirect(`/users/${userId}/tweets`)
      }
      // 名稱長度驗證
      if (name.length > 50) {
        //req.flash('error_message', 'name length is out of range')
        return res.redirect(`/users/${userId}/tweets`)
      }
      // 自介長度驗證
      if (introduction !== '') {
        if (introduction.length > 140) {
          //req.flash('error_message', 'introduction length is out of range')
          return res.redirect(`/users/${userId}/tweets`)
        }
      }
      // 載入兩張圖
      if (cover && avatar) {
        imgur.setClientID(IMGUR_CLIENT_ID)
        imgur.upload(cover[0].path, (err, imgCover) => {
          if (avatar) {
            imgur.upload(avatar[0].path, async (err, imgAvr) => {
              const user = await User.findByPk(userId)
              await user.update({
                cover: cover[0] ? imgCover.data.link : user.cover,
                avatar: avatar[0] ? imgAvr.data.link : user.avatar,
                name: name,
                introduction: introduction ? introduction : ''
              })
              return res.redirect(`/users/${userId}/tweets`)
            })
          }
        })
      } else if (cover) { // 載入 cover
        imgur.setClientID(IMGUR_CLIENT_ID)
        imgur.upload(cover[0].path, async (err, imgCover) => {
          const user = await User.findByPk(userId)
          await user.update({
            cover: cover[0] ? imgCover.data.link : user.cover,
            avatar: user.avatar,
            name: name,
            introduction: introduction ? introduction : ''
          })
          return res.redirect(`/users/${userId}/tweets`)
        })
      } else if (avatar) { // 載入 avatar
        imgur.setClientID(IMGUR_CLIENT_ID)
        imgur.upload(avatar[0].path, async (err, imgAvr) => {
          const user = await User.findByPk(userId)
          await user.update({
            cover: user.cover,
            avatar: avatar[0] ? imgAvr.data.link : user.avatar,
            name: name,
            introduction: introduction ? introduction : ''
          })
          return res.redirect(`/users/${userId}/tweets`)
        })
      } else { // 皆無載入
        const user = await User.findByPk(userId)
        await user.update({
          cover: user.cover,
          avatar: user.avatar,
          name: name,
          introduction: introduction ? introduction : ''
        })
        return res.redirect(`/users/${userId}/tweets`)
      }
    } catch (err) {
      return console.warn(err)
    }
  }
}
module.exports = apiController