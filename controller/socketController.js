const socketController = {
  getPublicSocket: (req, res) => {
    const publicSocketPage = true

    return res.render('publicSocket', {
      publicSocketPage
    })
  }
}
module.exports = socketController 