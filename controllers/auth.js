const passport = require("passport");
const validator = require("validator");
const User = require("../models/User")
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();

exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect("/profile");
  }
  res.render("login", {
    title: "Login",
  });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash("errors", info);
            return res.redirect("../login");
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", { msg: "Success! You are logged in." });
            res.redirect("../profile");
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
          console.log('this is the user in postForgotPassword', user);
            if (!user) {
                req.flash("errors", { msg: "No account with that email address exists." });
                return res.redirect("../forgot-password");
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000; // 1 hour 
            console.log('this is the token', token);
            console.log('this is the user', user);
            return user.save();
        })
        .then((result) => {
            res.redirect("../login");
            const transporter = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    user: 'aaronbush3@gmail.com',
                    pass: process.env.NODEMAIL_PASS
                  }
            });
            transporter.sendMail({
                to: email,
                from: "your email",
                subject: "Password Reset",
                html: `
                    <p>You requested a password reset from Gratitude App</p>
                    <p> click this <a href="${process.env.HOST_SITE}/reset-password/${token}">link</a> to set a new password.</p>
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
    });
};

exports.postResetPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const token = req.body.token;
  let resetUser;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        const error = new Error("Password reset token is invalid or has expired.");
        error.httpStatusCode = 400;
        throw error;
      }
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      console.log('this is the reset users password', resetUser.password);
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      console.log('this is the reset user', resetUser);
        return resetUser.save().then((updatedUser) => {
            console.log("Updated user:", updatedUser);
        });
    })
    .then((result) => {
      res.redirect("../login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postChangePassword = async (req, res, next) => {
  const newPassword = req.body.newPassword;
  const oldPassword = req.body.oldPassword;
  const userId = req.user._id;
  const email = req.body.email;

  if (!newPassword || !oldPassword || !email) {
    return res.status(400).render("edit-profile", {
      errorMessage: "All fields are required.",
    });
  }

  let resetUser;
  User.findOne({
    _id: userId,
  })
    .then((user) => {
      if (!user) {
        const error = new Error("User not found.");
        error.httpStatusCode = 400;
        throw error;
      }
      resetUser = user;
      return bcrypt.compare(oldPassword, user.password);
    })
    .then((isMatch) => {
      if (!isMatch) {
        const error = new Error("Old password is incorrect.");
        error.httpStatusCode = 400;
        throw error;
      }
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      return resetUser.save().then((updatedUser) => {
        console.log("Updated user:", updatedUser);
      });
    })
    .then((result) => {
      res.redirect("../login");
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
