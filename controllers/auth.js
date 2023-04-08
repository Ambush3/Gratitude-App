const passport = require("passport");
const validator = require("validator");
const User = require("../models/User")
// TODO: See if I need this 
// const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();

const sendMailPassword = process.env.NODEMAIL_PASS;
console.log('this is the password', sendMailPassword)

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


exports.postResetPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  const token = req.body.token;

  if (newPassword !== passwordConfirm) {
    req.flash("errors", { msg: "Passwords do not match." });
    return res.redirect(`/auth/reset-password/${token}`);
  }

  let resetUser;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        req.flash("errors", { msg: "Password reset token is invalid or has expired." });
        return res.redirect("/auth/forgot-password");
      }
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      if (resetUser) {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
      } else {
        req.flash("errors", { msg: "An error occurred while resetting your password. Please try again." });
        return res.redirect("/auth/forgot-password");
        // return Promise.reject(new Error("An error occurred while resetting your password."));
      }
    })
    .then((result) => {
      req.flash("success", { msg: "Your password has been reset successfully." });
      res.redirect("/auth/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};



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
      profilePicture: req.body.profilePicture,
  });

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
