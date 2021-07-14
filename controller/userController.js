const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const Followship = db.Followship
const Reply = db.Reply

const helpers = require('../_helpers')

const userController = {
  //註冊頁面
  signUpPage: (req, res) => {
    return res.render('signup')
  },

  //註冊
  signUp: (req, res) => {
    if (req.body.checkPassword !== req.body.password) {
      req.flash('error_messages', '兩次密碼輸入不同！')
      return res.redirect('/signup')
    } else {
      User.findOne({ where: { email: req.body.email } })
        .then(user => {
          if (user) {
            req.flash('error_messages', '信箱重複！')
            return res.redirect('/signup')
          } else {
            User.create({
              name: req.body.name,
              email: req.body.email,
              password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
            }).then(user => {
              req.flash('success_messages', '成功註冊帳號！')
              return res.redirect('/signin')
            })
          }
        })
    }
  },

  //登入頁面
  signInPage: (req, res) => {
    if (res.locals.user) {
      delete res.locals.user
    }
    return res.render('signin')
  },

  //登入
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/tweets')
  },

  //登出
  signOut: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },

  getUserReplies: async (req, res) => {
    const topFollowing = res.locals.data
    const top5Following = topFollowing.slice(0, 5)
    const userInfo = res.locals.userInfo
    try {
      const replies = await Reply.findAll({
        raw: true,
        nest: true,
        where: {
          UserId: userInfo.user.id
        },
        include: [Tweet]
      })

      let Data = []
      Data = replies.map(async (reply, index) => {
        if (reply.Tweet.UserId) {
          const [tweetUser, likes, replies] = await Promise.all([
            User.findOne({
              raw: true,
              nest: true,
              where: {
                id: Number(reply.Tweet.UserId)
              }
            }),
            Like.findAndCountAll({
              raw: true,
              nest: true,
              where: {
                TweetId: reply.TweetId
              }
            }),
            Reply.findAndCountAll({
              raw: true,
              nest: true,
              where: {
                TweetId: reply.TweetId
              }
            })
          ])
          return {
            id: reply.id,
            createdAt: reply.createdAt,
            comment: reply.comment,
            TweetId: reply.TweetId,
            tweetDescription: reply.Tweet.description,
            tweetCreatedAt: reply.Tweet.createdAt,
            tweetUserId: tweetUser.id,
            tweetUserName: tweetUser.name,
            tweetUserAvatar: tweetUser.avatar,
            tweetUserAccount: tweetUser.account,
            likeCount: likes.count,
            replyCount: replies.count,
          }
        }
      })
      Promise.all(Data).then(data => {
        // console.log(data)
        data = data.sort((a, b) => a.tweetCreatedAt - b.tweetCreatedAt)
        return res.render('replies', {
          user: userInfo.user,
          followingCount: userInfo.followingCount,
          followerCount: userInfo.followerCount,
          replies: data,
          topFollowing: top5Following
        })
      })
    }
    catch (err) {
      console.log('getUserReplies err')
      return res.render('/')
    }
  },
  getUserLikes: async (req, res) => {
    const topFollowing = res.locals.data
    const top5Following = topFollowing.slice(0, 5)
    const userInfo = res.locals.userInfo
    try {
      const likes = await Like.findAll({
        raw: true,
        nest: true,
        where: {
          UserId: userInfo.user.id
        },
        include: [Tweet]
      })

      let Data = []
      Data = likes.map(async (like, index) => {
        const [tweetUser, likes, replies] = await Promise.all([
          User.findOne({
            raw: true,
            nest: true,
            where: {
              id: like.Tweet.UserId
            }
          }),
          Like.findAndCountAll({
            raw: true,
            nest: true,
            where: {
              TweetId: like.TweetId
            }
          }),
          Reply.findAndCountAll({
            raw: true,
            nest: true,
            where: {
              TweetId: like.TweetId
            }
          })
        ])
        return {
          id: like.id,
          tweetUser: tweetUser,
          likeCount: likes.count,
          replyCount: replies.count,
          tweet: like.Tweet
        }
      })
      Promise.all(Data).then(data => {
        data = data.sort((a, b) => a.tweet.createdAt - b.tweet.createdAt)
        return res.render('likes', {
          user: userInfo.user,
          followingCount: userInfo.followingCount,
          followerCount: userInfo.followerCount,
          likes: data,
          topFollowing: top5Following
        })
      })
    }
    catch (err) {
      console.log('getUserLikes err')
      return res.redirect('/')
    }
  },

  getUserTweets: (req, res) => {
    const topFollowing = res.locals.data
    // console.log(topFollowing)
    return User.findOne({
      where: {
        id: req.params.userId
      }
    }).then(user => {
      Followship.findAndCountAll({
        raw: true,
        nest: true,
        //使用者追蹤的所有人
        where: { followerId: user.id },
      }).then(following => {
        Followship.findAndCountAll({
          raw: true,
          nest: true,
          //追蹤使用者的所有人
          where: { followingId: user.id },
        }).then(follower => {
          Tweet.findAll({
            raw: true,
            nest: true,
            //使用者發的所有推文
            where: { userId: user.id },
          }).then(tweets => {
            const isFollowed = follower.rows.map(f => f.followerId).includes(helpers.getUser(req).id)

            return res.render('tweets', {
              user,
              followingCount: following.count,
              followerCount: follower.count,
              tweets,
              topFollowing,
              isFollowed
            })
          })
        })
      })
    })
  },


  getUserReplies: async (req, res) => {
    const topFollowing = res.locals.data
    const top5Following = topFollowing.slice(0, 5)
    const userInfo = res.locals.userInfo
    try {
      const replies = await Reply.findAll({
        raw: true,
        nest: true,
        where: {
          UserId: userInfo.user.id
        },
        include: [Tweet]
      })

      let Data = []
      Data = replies.map(async (reply, index) => {
        if (reply.Tweet.UserId) {
          const [tweetUser, likes, replies] = await Promise.all([
            User.findOne({
              raw: true,
              nest: true,
              where: {
                id: Number(reply.Tweet.UserId)
              }
            }),
            Like.findAndCountAll({
              raw: true,
              nest: true,
              where: {
                TweetId: reply.TweetId
              }
            }),
            Reply.findAndCountAll({
              raw: true,
              nest: true,
              where: {
                TweetId: reply.TweetId
              }
            })
          ])
          return {
            id: reply.id,
            createdAt: reply.createdAt,
            comment: reply.comment,
            TweetId: reply.TweetId,
            tweetDescription: reply.Tweet.description,
            tweetCreatedAt: reply.Tweet.createdAt,
            tweetUserId: tweetUser.id,
            tweetUserName: tweetUser.name,
            tweetUserAvatar: tweetUser.avatar,
            tweetUserAccount: tweetUser.account,
            likeCount: likes.count,
            replyCount: replies.count,
          }
        }
      })
      Promise.all(Data).then(data => {
        // console.log(data)
        data = data.sort((a, b) => a.tweetCreatedAt - b.tweetCreatedAt)
        return res.render('replies', {
          user: userInfo.user,
          followingCount: userInfo.followingCount,
          followerCount: userInfo.followerCount,
          replies: data,
          topFollowing: top5Following
        })
      })
    }
    catch (err) {
      console.log('getUserReplies err')
      return res.render('/')
    }
  },
  getUserLikes: async (req, res) => {
    const topFollowing = res.locals.data
    const top5Following = topFollowing.slice(0, 5)
    const userInfo = res.locals.userInfo
    try {
      //所有的like清單裡面屬於userInfo.user.id的
      const likes = await Like.findAll({
        raw: true,
        nest: true,
        where: {
          UserId: userInfo.user.id
        },
        //撈出userInfo.user.id關聯的推文
        include: [Tweet]
      })

      let Data = []
      //userInfo.user.id的like做資料陣列處理（已經撈到關聯推文）
      Data = likes.map(async (like, index) => {
        //從資料庫裡面查找userInfo.user.id的like, 其user, tweet, reply關聯資料
        const [tweetUser, likes, replies] = await Promise.all([
          User.findOne({
            raw: true,
            nest: true,
            where: {
              //關聯推文資料的UserId
              id: like.Tweet.UserId
            }
          }),
          Like.findAndCountAll({
            raw: true,
            nest: true,
            where: {
              //Like資料有關聯TweetId，而與user.id有關的TweetId，可以用來對應Like資料庫裡，有多少相同的TweetId，表示有多少人喜歡的數字
              TweetId: like.TweetId
            }
          }),
          Reply.findAndCountAll({
            raw: true,
            nest: true,
            where: {
              TweetId: like.TweetId
            }
          })
        ])
        return {
          id: like.id,
          tweetUser: tweetUser,
          likeCount: likes.count,
          replyCount: replies.count,
          tweet: like.Tweet
        }
      })
      Promise.all(Data).then(data => {
        data = data.sort((a, b) => a.tweet.createdAt - b.tweet.createdAt)
        return res.render('likes', {
          user: userInfo.user,
          followingCount: userInfo.followingCount,
          followerCount: userInfo.followerCount,
          likes: data,
          topFollowing: top5Following
        })
      })
    }
    catch (err) {
      console.log('getUserLikes err')
      return res.render('/')
    }
  },

  getUserFollowings: async (req, res) => {
    const topFollowing = res.locals.data
    const top5Following = topFollowing.slice(0, 5)
    const userInfo = res.locals.userInfo
    try {
      const tweets = await Tweet.findAndCountAll({
        raw: true,
        nest: true,
        where: {
          UserId: req.params.userId
        }
      })

      let Data = []
      const tweetCount = tweets.count
      Data = userInfo.followings.map(async (following, index) => {
        const [followingUser] = await Promise.all([
          User.findOne({
            raw: true,
            nest: true,
            where: {
              id: following.followingId
            }
          })
        ])
        return {
          followingUser: followingUser
        }
      })
      Promise.all(Data).then(data => {
        return res.render('followings', {
          user: userInfo.user,
          data,
          tweetCount,
          topFollowing: top5Following
        })
      })
    }
    catch (err) {
      console.log('getUserFollowings err')
      return res.redirect('/')
    }
  },

  getUserFollowers: async (req, res) => {
    const topFollowing = res.locals.data
    const top5Following = topFollowing.slice(0, 5)
    const userInfo = res.locals.userInfo
    try {
      const tweets = await Tweet.findAndCountAll({
        raw: true,
        nest: true,
        where: {
          UserId: req.params.userId
        }
      })

      let Data = []
      const tweetCount = tweets.count
      Data = userInfo.followers.map(async (follower, index) => {
        const [followerUser] = await Promise.all([
          User.findOne({
            raw: true,
            nest: true,
            where: {
              id: follower.followerId
            }
          })
        ])
        return {
          followerUser: followerUser
        }
      })
      Promise.all(Data).then(data => {
        return res.render('followers', {
          user: userInfo.user,
          data,
          tweetCount,
          topFollowing: top5Following
        })
      })
    }
    catch (err) {
      console.log('getUserFollowers err')
      return res.redirect('/')
    }
  },

  //MiddleWare
  getUserInfo: (req, res, next) => {
    return User.findOne({
      where: {
        id: req.params.userId
      }
    }).then(user => {
      Followship.findAndCountAll({
        raw: true,
        nest: true,
        where: { followerId: user.id }
      }).then(following => {
        Followship.findAndCountAll({
          raw: true,
          nest: true,
          where: { followingId: user.id },
        }).then(follower => {
          res.locals.userInfo = {
            user: user.dataValues,
            followings: following.rows,
            followers: follower.rows,
            followingCount: following.count,
            followerCount: follower.count
          }
          return next()
        })
      })
    })
  },
  //進入帳號設定頁面
  getUserEdit: (req, res) => {
    return User.findByPk(req.params.userId)
      .then(user => {
        res.render('userEdit', { user: user.toJSON() })
      })
  },

  putUserEdit: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', "name didn't exist")
      return res.redirect('back')
    }
    if (req.body.passwordCheck !== req.body.password) {
      req.flash('error_messages', '兩次密碼輸入不同！')
      return res.redirect('/signup')
    } else {
      User.findByPk(req.params.userId)
        .then((user) => {
          user.update({
            account: req.body.account,
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
          })
            .then((user) => {
              req.flash('success_messages', 'user was successfully to update')
              res.redirect(`/users/${user.id}/edit`)
            })
        })
    }
  },

  //按讚
  addLike: (req, res) => {
    return Like.create({
      UserId: helpers.getUser(req).id,
      TweetId: req.params.tweetId
    })
      .then((like) => {
        return res.redirect('back')
      })
  },
  //取消按讚
  removeLike: (req, res) => {
    return Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.tweetId
      }
    })
      .then((like) => {
        // return console.log(like)
        like.destroy()
          .then((tweet) => {
            return res.redirect('back')
          })
      })
  },
  //追蹤使用者
  follow: (req, res) => {
    return Followship.create({
      followerId: helpers.getUser(req).id,
      followingId: req.params.userId
    })
      .then((followship) => {
        return res.redirect('back')
      })
  },
  //取消追蹤使用者
  unFollow: async (req, res) => {
    try {
      await Followship.destroy({
        where: {
          followerId: helpers.getUser(req).id,
          followingId: req.params.userId
        }
      })
      // console.log(followship.followerId)
      // console.log(followship.followingId)
      // console.log(followship)

      return res.redirect('back')

    } catch (err) {
      console.warn(err)
    }
  },
  //MiddleWare
  getUserInfo: (req, res, next) => {
    return User.findOne({
      where: {
        id: req.params.userId
      }
    }).then(user => {
      Followship.findAndCountAll({
        raw: true,
        nest: true,
        where: { followerId: user.id },
      }).then(following => {
        Followship.findAndCountAll({
          raw: true,
          nest: true,
          where: { followingId: user.id },
        }).then(follower => {
          res.locals.userInfo = {
            user: user.dataValues,
            followings: following.rows,
            followers: follower.rows,
            followingCount: following.count,
            followerCount: follower.count
          }
          return next()
        })
      })
    })
  },
}

module.exports = userController