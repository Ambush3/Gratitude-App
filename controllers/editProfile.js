// be able to edit profile
// add profile picture
// add bio
// add location
// add interests

const validator = require("validator");
const User = require("../models/User");

module.exports = {
    getEditProfile: (req, res) => {
        res.render("edit-profile", {
            title: "Edit Profile",
        });
    },

    postChangeUsername: async (req, res, next) => {
        const validationErrors = [];
        if (!validator.isLength(req.body.username, { min: 3, max: 20 })) {
            validationErrors.push({ msg: "Username must be between 3 and 20 characters long." });
        }
        if (!req.body.username) {
            validationErrors.push({ msg: "Username is required." });
        }
        if (validationErrors.length) {
            req.flash("errors", validationErrors);
            return res.redirect("/edit-profile");
        }

        const newUserName = req.body.username;
        const userId = req.user._id;

        let existingUser;
        try {
            existingUser = await User.findOne({ userName: newUserName });
            if (existingUser) {
                req.flash("errors", {
                    msg: "Username already exists. Please choose another one.",
                });
                return res.redirect("../edit-profile");
            }

            const user = await User.findOne({ _id: userId });
            if (!user) {
                const error = new Error("User not found.");
                error.httpStatusCode = 400;
                throw error;
            }

            user.userName = newUserName;
            await user.save();

            req.flash("success", { msg: "Username updated successfully." });
            res.redirect("../edit-profile");
        } catch (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
    },

};

