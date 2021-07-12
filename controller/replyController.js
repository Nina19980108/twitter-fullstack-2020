const { sequelize } = require('../models')
const db = require('../models')
const helpers = require('../_helpers')
const Reply = db.Reply

const replyController = {
  postReply: async (req, res) => {
    try {
      const { comment } = req.body
      const { tweetId } = req.params
      console.log(comment)
      console.log(tweetId)
      if (comment === '') {
        return res.redirect('/')
      }

      await Reply.create({
        comment: comment,
        UserId: helpers.getUser(req).id,
        TweetId: tweetId
      })
      return res.redirect(`/tweets/${tweetId}`)
    } catch (err) {
      console.warn(err)
    }
  }
}
module.exports = replyController