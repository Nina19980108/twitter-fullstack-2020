const db = require('../models')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const Followship = db.Followship
const Reply = db.Reply

const pageLimit = 10

const adminController = {
  //登入頁面
  adminSignInPage: (req, res) => {
    if (res.locals.user) {
      delete res.locals.user
    }
    return res.render('admin/signin')
  },

  adminSignIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/admin/tweets')
  },

  getAdminTweets: (req, res) => {
    let offset = 0
    if (req.query.page) {
      offset = (Number(req.query.page) - 1) * pageLimit
    }
    return Tweet.findAndCountAll({
      raw: true,
      nest: true,
      include: [User],
      offset,
      limit: pageLimit,
      order: [['createdAt', 'DESC']]
    }).then(tweets => {
      const page = Number(req.query.page) || 1
      const pages = Math.ceil(tweets.count / pageLimit)
      const totalPage = Array.from({ length: pages }, (item, index) => index + 1)
      const prev = page - 1 < 1 ? 1 : page - 1
      const next = page + 1 > pages ? pages : page + 1
      return res.render('admin/tweets', {
        tweets: tweets.rows,
        page,
        totalPage,
        prev,
        next
      })
    })
  },

  deleteAdminTweet: (req, res) => {
    return Tweet.findOne({
      where: {
        id: req.params.tweetId
      }
    }).then(tweet => {
      tweet.destroy()
        .then(tweet => {
          return res.redirect('back')
        })
    })
  },

  getAdminUsers: async (req, res) => {
    try {
      const users = await User.findAndCountAll({
        raw: true,
        nest: true,
      })

      let Data = []
      Data = users.rows.map(async (user, index) => {
        const [following, follower, tweet] = await Promise.all([
          Followship.findAndCountAll({
            raw: true,
            nest: true,
            where: { followerId: user.id },
          }),
          Followship.findAndCountAll({
            raw: true,
            nest: true,
            where: { followingId: user.id },
          }),
          Tweet.findAndCountAll({
            raw: true,
            nest: true,
            where: { UserId: user.id },
          })
        ])
        // 拉出 每則貼文 Like 資料
        let tweetLike = tweet.rows.map(async (tw, index) => {
          const like = await Like.findAndCountAll({
            raw: true,
            nest: true,
            where: { tweetId: tw.id }
          })
          return like.count
        })
        // 取得 Like 陣列
        tweetLike = await Promise.all(tweetLike)
        // 累加 Like 陣列, 空陣列回傳 0, 下面的 like 直接是 所有該使用者推文的 like 累加數量
        const like = tweetLike.length > 0 ? tweetLike.reduce((a, b) => a + b) : 0
        return {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          account: user.account,
          cover: user.cover,
          following: following,
          follower: follower,
          reply: tweet,
          like: like
        }
      })
      Promise.all(Data).then(data => {
        return res.render('admin/users', { data })
      })

    }

    catch (err) {
      req.flash('error_message', err)
      return res.redirect('/') // 假定回到首頁
    }
  }

}
module.exports = adminController