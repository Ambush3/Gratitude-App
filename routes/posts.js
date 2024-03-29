const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const postsController = require("../controllers/posts");
const { ensureAuth } = require("../middleware/auth");

router.get("/profile", postsController.getProfilePic);
router.post("/createPost", upload.single("file"), postsController.createPost);
router.put("/likePost/:id", postsController.likePost);
router.delete("/deletePost/:id", postsController.deletePost);
router.post("/savePost/:id", postsController.savePost);
router.get("/logout", postsController.logout);
router.post("/profile", postsController.getPostByDate);
router.post("/createProfilePic", upload.single("file"), postsController.createProfilePic);
router.delete("/unsavePost/:id", ensureAuth, postsController.unsavePost);
router.put("/post/:id", upload.single("imageUpload"), postsController.updatePost);

module.exports = router;

