// const express = require('express')
// const router = express.Router()
const helpers = require('../_helpers')
const userController = require('../controller/userController')
const adminController = require('../controller/adminController')
const tweetController = require('../controller/tweetController')
const apiController = require('../controller/apiController')
const replyController = require('../controller/replyController')

const db = require('../models')
const Followship = db.Followship
const User = db.User

const getTopFollowing = async (req, res, next) => {
  try {
    const users = await User.findAll({
      raw: true,
      nest: true,
    })

    let Data = []
    Data = users.map(async (user, index) => {

      const [following] = await Promise.all([
        Followship.findAndCountAll({
          raw: true,
          nest: true,
          where: {
            //Followship裡面，user 追蹤的 followingId 有幾個是這個user.Id，表示這個user.Id有幾個追蹤者
            //因此得到了每個user的 follower數字(有多少followingId，代表被多少人追蹤)
            followingId: user.id
          }
        })
      ])

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        account: user.account,
        followerCount: following.count,
        isFollowed: following.rows.map(f => f.followerId).includes(helpers.getUser(req).id)
      }
    })
    Promise.all(Data).then(data => {

      data = data.sort((a, b) => b.followerCount - a.followerCount)
      res.locals.data = data
      return next()
    })
  }
  catch (err) {
    console.log('getTopFollowing err')
    return next()
  }
}


module.exports = (app, passport) => {
  const authenticated = (req, res, next) => {
    if (helpers.ensureAuthenticated(req)) {// = req.isAuthenticated()
      return next()
    }
    res.redirect('/signin')
  }
  const authenticatedAdmin = (req, res, next) => {
    if (helpers.ensureAuthenticated(req)) {
      if (helpers.getUser(req).role) {
        return next()
      }
      return res.redirect('/')
    }
    res.redirect('/signin')
  }
  //如果登入的人是管理者，並且只用在管理者登入的路由
  const isAdmin = (req, res, next) => {
    res.locals.isAdmin = req.user.role === 'admin'
    return next()
  }

  app.get('/admin/signin', adminController.adminSignInPage)
  app.post('/admin/signin', passport.authenticate('local', { failureRedirect: '/admin/signin', failureFlash: true }), isAdmin, adminController.adminSignIn)
  app.get('/admin/tweets', authenticatedAdmin, isAdmin, adminController.getAdminTweets)
  app.get('/admin/users', authenticatedAdmin, isAdmin, adminController.getAdminUsers)
  app.delete('/admin/tweets/:tweetId', authenticatedAdmin, isAdmin, getTopFollowing, adminController.deleteAdminTweet)

  //前台
  app.get('/', authenticated, (req, res) => res.redirect('/tweets'))
  app.get('/tweets', authenticated, getTopFollowing, tweetController.getTweets)
  app.post('/tweets', authenticated, getTopFollowing, tweetController.postTweet)
  app.get('/tweets/:tweetId', authenticated, getTopFollowing, tweetController.getTweet)
  app.get('/tweets/:tweetId/replies', authenticated, getTopFollowing, tweetController.getTweet)
  app.post('/tweets/:tweetId/replies', authenticated, getTopFollowing, replyController.postReply)
  app.get('/tweets/:tweetId', authenticated, getTopFollowing, tweetController.getTweet)
  app.post('/tweets/:tweetId/like', authenticated, userController.addLike)
  app.delete('/tweets/:tweetId', authenticated, userController.removeLike)
  
  //登入、註冊、登出
  app.get('/signup', userController.signUpPage)
  app.post('/signup', userController.signUp)
  app.get('/signin', userController.signInPage)
  app.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.signIn)
  app.get('/signout', userController.signOut)

  //使用者相關
  app.get('/users/:userId/replies', authenticated, getTopFollowing, userController.getUserInfo, userController.getUserReplies)
  app.get('/users/:userId/likes', authenticated, getTopFollowing, userController.getUserInfo, userController.getUserLikes)
  app.get('/users/:userId/tweets', authenticated, getTopFollowing, userController.getUserTweets)
  app.post('/users/:userId/unfollow', authenticated, userController.unFollow)
  app.post('/users/:userId/follow', authenticated, userController.follow)
  app.get('/users/:userId/edit', authenticated, userController.getUserEdit)
  app.put('/users/:userId', authenticated, userController.putUserEdit)
  
  app.get('/api/tweet/:tweetId', authenticated, apiController.getTweet)
}