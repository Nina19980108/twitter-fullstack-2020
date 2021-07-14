// const express = require('express')
// const router = express.Router()
const helpers = require('../_helpers')
const userController = require('../controller/userController')
const adminController = require('../controller/adminController')
const tweetController = require('../controller/tweetController')
const apiController = require('../controller/apiController')
const replyController = require('../controller/replyController')
const multer = require('multer')
const upload = multer({ dest: 'temp/' })

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
            followingId: user.id
          }
        })
      ])
      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        account: user.account,
        followerCount: following.count
        //isFollow 等有使用者登入認證之後才做
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
      return res.redirect('/')//似乎都會跑這裡
    }
    res.redirect('/signin')
  }
  app.get('/admin/signin', adminController.adminSignInPage)
  app.post('/admin/signin', passport.authenticate('local', { failureRedirect: '/admin/signin', failureFlash: true }), adminController.adminSignIn)
  app.get('/admin/tweets', authenticatedAdmin, adminController.getAdminTweets)
  app.get('/admin/users', adminController.getAdminUsers)
  app.delete('/admin/tweets/:tweetId', getTopFollowing, adminController.deleteAdminTweet)

  //登入、註冊、登出
  app.get('/signup', userController.signUpPage)
  app.post('/signup', userController.signUp)
  app.get('/signin', userController.signInPage)
  app.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.signIn)
  app.get('/logout', userController.logout)


  app.get('/', authenticated, (req, res) => res.redirect('/tweets'))
  app.get('/tweets', authenticated, getTopFollowing, tweetController.getTweets)
  app.post('/tweets', authenticated, getTopFollowing, tweetController.postTweet)
  app.get('/tweets/:tweetId', authenticated, getTopFollowing, tweetController.getTweet)
  app.get('/tweets/:tweetId/replies', authenticated, getTopFollowing, tweetController.getTweet)
  app.post('/tweets/:tweetId/replies', authenticated, getTopFollowing, replyController.postReply)

  app.get('/users/:userId/replies', authenticated, getTopFollowing, userController.getUserInfo, userController.getUserReplies)
  app.get('/users/:userId/likes', authenticated, getTopFollowing, userController.getUserInfo, userController.getUserLikes)
  app.get('/users/:userId/tweets', authenticated, getTopFollowing, userController.getUserTweets)
  app.get('/users/:userId/followings', authenticated, getTopFollowing, userController.getUserInfo, userController.getUserFollowings)
  app.get('/users/:userId/followers', authenticated, getTopFollowing, userController.getUserInfo, userController.getUserFollowers)

  app.get('/api/tweet/:tweetId', authenticated, apiController.getTweet)
  app.get('/api/users/:userId', authenticated, apiController.getUser)
  app.post('/api/users/:userId', authenticated, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]), apiController.postUser)
}