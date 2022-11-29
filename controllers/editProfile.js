// be able to edit profile
// add profile picture
// add bio
// add location
// add interests

module.exports = {
    getEditProfile: (req, res) => {
        res.render("edit-profile", {
            title: "Edit Profile",
        });
    },
    // postEditProfile: (req, res, next) => {
    //     const validationErrors = [];
    //     if (!validator.isEmail(req.body.email)){
    //         validationErrors.push({ msg: "Please enter a valid email address." });
    //         {
    //             req.flash("errors", validationErrors);
    //             return res.redirect("../edit-profile");
    //         }
    //     }
    // }
}