const express = require("express");
const router = express.Router();
const commentsController = require("../controllers/comments");
const { ensureAuth, ensureGuest } = require("../middleware/auth");


// this route is for creating a comment
router.post("/createComment/:id", commentsController.createComment);

module.exports = router;
