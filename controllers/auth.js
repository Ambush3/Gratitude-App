const passport = require("passport");
const validator = require("validator");
const User = require("../models/User")
const mongoose = require("mongoose");
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


exports.postForgotPassword = (req, res, next) => {
    const validationErrors = [];
    if (!validator.isEmail(req.body.email))
        validationErrors.push({ msg: "Please enter a valid email address." });
    if (validationErrors.length) {
        req.flash("errors", validationErrors);
        return res.redirect("../forgot-password");
    }
    req.body.email = validator.normalizeEmail(req.body.email, {
        gmail_remove_dots: false,
    });
    const email = req.body.email;



    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect("../forgot-password");
        }
        const token = buffer.toString("hex");

      
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                req.flash("errors", { msg: "No account with that email address exists." });
                return res.redirect("../forgot-password");
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then((result) => {
            res.redirect("../login");
            const transporter = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    user: 'aaronbush3@gmail.com',
                    // pass: '{sendMailPassword}',
                    pass: 'bbizwfczispjhjkb'
                  }
            });
            transporter.sendMail({
                to: email,
                from: "your email",
                subject: "Password Reset",
                html: `
                    <p>You requested a password reset from Gratitude App</p>
                    <p>Click this <a href="https://seal-app-rnsi4.ondigitalocean.app/reset-password/${token}">link</a> to set a new password.</p>
                `,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    });
};

exports.getResetPassword = (req, res) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("reset-password", {
        title: "Reset Password",
        path: "../reset-password",
        errorMessage: message,
        token: token, // Pass the token variable to the view
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      // return next(error);
    });
};


exports.postResetPassword = async (req, res, next) => {
  try {
    const newPassword = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;
    const token = req.body.token;

    if (newPassword !== passwordConfirm) {
      req.flash("errors", { msg: "Passwords do not match." });
      return res.redirect(`/reset-password/${token}`);
    }

    let resetUser = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });

    if (!resetUser) {
      console.log("Token:", token);
      console.log("Reset token expiration:", resetUser.resetTokenExpiration);
      console.log("Current time:", Date.now());
      req.flash("errors", { msg: "Password reset token is invalid or has expired." });
      return res.redirect("/forgot-password");
    }


    const hashedPassword = await bcrypt.hash(newPassword, 12);
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    await resetUser.save();

    req.flash("success", { msg: "Your password has been reset successfully." });
    res.redirect("/login");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
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
