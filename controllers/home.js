module.exports = {
  getIndex: (req, res) => {
    res.render("index.ejs");
  },

    getMotivation: (req, res) => {
    res.render("daily-motivation.ejs");
  }
};
