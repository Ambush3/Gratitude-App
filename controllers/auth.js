const passport = require("passport");
const validator = require("validator");
const User = require("../models/User");

exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect("/profile");
  }
  res.render("login", {
    title: "Login",
  });
};

exports.postLogin = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (validator.isEmpty(req.body.password))
    validationErrors.push({ msg: "Password cannot be blank." });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/login");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  passport.authenticate("local", (err, user, info) => { // passport.authenticate() is a middleware that authenticates the user
    if (err) {
      return next(err);
    }
    if (!user) { // if user is not found
      req.flash("errors", info);
      return res.redirect("/login");
    }
    req.logIn(user, (err) => { // req.logIn() is a method that logs in the user
      if (err) {
        return next(err);
      }
      req.flash("success", { msg: "Success! You are logged in." });
      res.redirect(req.session.returnTo || "/profile"); // redirect to profile page
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout(() => {
    console.log('User has logged out.')
  })
  req.session.destroy((err) => {
    if (err)
      console.log("Error : Failed to destroy the session during logout.", err);
    req.user = null;
    res.redirect("/");
  });
};

exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect("/profile");
  }
  res.render("signup", {
    title: "Create Account",
  });
};

exports.getForgotPassword = (req, res) => {
  if (req.user) {
    return res.redirect("/profile");
  }
  res.render("forgot-password", {
    title: "Forgot Password",
  });
};


exports.postForgotPassword = (req, res, next) => {
    // using bcrypt and salt, match email from #email in forgot-password.ejs and find email
    // in database then change password from newPassword input
    const validationErrors = [];
    if (!validator.isEmail(req.body.email)){
        validationErrors.push({ msg: "Please enter a valid email address." });
    }
    if (validationErrors.length) {
        req.flash("errors", validationErrors);
        return res.redirect("../forgot-password");
    }
    req.body.email = validator.normalizeEmail(req.body.email, {
        gmail_remove_dots: false,
    });
    const email = req.body.email;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    if (newPassword !== confirmPassword){
        req.flash("errors", { msg: "Passwords do not match" });
        return res.redirect("../forgot-password");
    }
    User.findOne({ email: email }, (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash("errors", { msg: "Account with that email address does not exist." });
            return res.redirect("../forgot-password");
        }
        user.password = newPassword;
        user.save((err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", { msg: "Success! Your password has been changed." });
            res.redirect("/");
        });

    });

}

exports.postSignup = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (!validator.isLength(req.body.password, { min: 8 }))
    validationErrors.push({
      msg: "Password must be at least 8 characters long",
    });
  if (req.body.password !== req.body.confirmPassword)
    validationErrors.push({ msg: "Passwords do not match" });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("../signup");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  const user = new User({
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password,
  });

  // find userName of current post
  const userName = req.body.userName;

  User.findOne(
    { $or: [{ email: req.body.email }, { userName: req.body.userName }] },
    (err, existingUser) => {
      if (err) {
        return next(err);
      }
      if (existingUser) {
        req.flash("errors", {
          msg: "Account with that email address or username already exists.",
        });
        return res.redirect("../signup");
      }
      user.save((err) => {
        if (err) {
          return next(err);
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          res.redirect("/profile");
        });
      });
    }
  );
};
