const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const SavedPosts = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

module.exports = mongoose.model("SavedPosts", SavedPosts);