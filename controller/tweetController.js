const { sequelize } = require('../models')
const db = require('../models')
const helpers = require('../_helpers')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const Followship = db.Followship
const Reply = db.Reply
const pageLimit = 10
const tweetController = {
  getTweets: async (req, res) => {
    try {
      if (helpers.getUser(req).role === 'admin') {
        return res.redirect('/admin/tweets')
      }

      const topFollowing = res.locals.data
      const user = {
        id: helpers.getUser(req).id,
        avatar: helpers.getUser(req).avatar
      }
      let offset = 0
      if (req.query.page) {
        offset = (Number(req.query.page) - 1) * pageLimit
      }
      const tweets = await Tweet.findAndCountAll({
        raw: true,
        nest: true,
        attributes: ['id', 'description', 'updatedAt'],
        include: [
          { model: User, attributes: ['id', 'avatar', 'name', 'account'] }
        ],
        offset,
        limit: pageLimit,
        order: [['updatedAt', 'DESC']]
      })
      let Data = []
      Data = tweets.rows.map(async (tweet, index) => {
        const [replyCount, likeCount] = await Promise.all([
          Reply.findAndCountAll({
            raw: true,
            nest: true,
            where: { TweetId: tweet.id },
          }),
          Like.findAndCountAll({
            raw: true,
            nest: true,
            where: { TweetId: tweet.id },
          }),
        ])
        return {
          ...tweet,
          replyCount: replyCount.count,
          likeCount: likeCount.count
        }
      })
      const page = Number(req.query.page) || 1
      const pages = Math.ceil(tweets.count / pageLimit)
      const totalPage = Array.from({ length: pages }, (item, index) => index + 1)
      const prev = page - 1 < 1 ? 1 : page - 1
      const next = page + 1 > pages ? pages : page + 1
      Promise.all(Data).then(data => {
        return res.render('index', {
          data,
          user,
          page,
          totalPage,
          prev,
          next,
          topFollowing
        })
      })
    } catch (err) {
      return res.redirect('/')
    }
  },

  getTweet: async (req, res) => {
    try {
      const topFollowing = res.locals.data
      const { tweetId } = req.params
      const tweet = await Tweet.findByPk(tweetId, {
        include: [
          { model: User, attributes: ['id', 'name', 'account', 'avatar'] }
        ]
      })
      const replies = await Reply.findAndCountAll({
        raw: true,
        nest: true,
        where: { TweetId: tweetId },
        include: [
          { model: User, attributes: ['id', 'name', 'account', 'avatar'] }
        ]
      })
      const likes = await Like.findAll({
        raw: true,
        nest: true,
        where: { TweetId: tweet.id },
        attributes: [
          [sequelize.fn('count', sequelize.col('id')), 'likeCounts']
        ]
      })
      const likers = await Like.findAll({
        raw: true,
        nest: true,
        where: { TweetId: tweet.id },
        attributes: ['UserId']
      })
      const isLiked = likers.map(d => d.UserId).includes(helpers.getUser(req).id)

      return res.render('singleTweet', {
        tweet,
        replyCount: replies.count,
        reply: replies.rows,
        likeCount: likes[0].likeCounts,
        topFollowing, isLiked
      })

    } catch (err) {
      return res.redirect('/')
    }
  },

  postTweet: async (req, res) => {
    try {
      const { description } = req.body
      if (description === '') {
        return res.redirect('/')
      }
      if (description.length > 140) {
        return res.redirect('/')
      }

      await Tweet.create({
        description: description,
        UserId: helpers.getUser(req).id
      })
      return res.redirect('/')
    } catch (err) {
      return res.redirect('/')
    }
  }
}

module.exports = tweetController