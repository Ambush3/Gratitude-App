const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const motivationController = require("../controllers/motivation");
const editProfileController = require("../controllers/editProfile");
const postsController = require("../controllers/posts");
const { ensureAuth} = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", homeController.getIndex);
router.get("/profile", ensureAuth, postsController.getProfile);
router.get("/profile", postsController.getProfilePic);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);
router.get("/forgot-password", authController.getForgotPassword);
router.post("/forgot-password", authController.postForgotPassword);
router.delete("/post/:id", postsController.deletePost);
// router.post("/profile", postsController.getPostByDate);
router.get("/daily-motivation", motivationController.getMotivation);
router.get("/edit-profile", editProfileController.getEditProfile);
module.exports = router;