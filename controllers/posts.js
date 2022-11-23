const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const ProfilePicture = require("../models/ProfilePicture");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id }); // find all posts by the current user id
      const profilePic = await ProfilePicture.find({ user: req.user.id, profilePicture: req.user.profilePicture});
      res.render("profile.ejs", { posts: posts, profilePic: profilePic, user: req.user }); // render the profile page and pass the posts and user data to it
      // find profile pic by the current user id

    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id); // find the post by its id
      const comments = await Comment.find({post: req.params.id}).sort({ createdAt: "desc" }).lean(); // find all comments for the post and sort them by the date they were created
      res.render("post.ejs", { post: post, user: req.user, comments: comments }); // render the post page and pass in the post, user and comments
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id, // add the user id to the post
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },

  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id }, // find the post by its id
        { // update the likes
          $inc: { likes: 1 }, // increment the likes by 1
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`); // redirect to the post page
    } catch (err) { // if there is an error
      console.log(err); // log the error
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id }); // find the post by its id and store it in the post variable
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId); // delete the image from cloudinary using the cloudinaryId
      await Post.remove({ _id: req.params.id });  // Delete post from db
      console.log("Deleted Post");
      res.redirect("/profile"); // redirect to the profile page
    } catch (err) {
      res.redirect("/profile");
    }
  },

  logout: async (req, res) => {
      req.logout();
      res.redirect("/");
  },
  
  getPostByDate: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id, createdAt: req.body.date }); // find all posts by the current user id
      res.render("profile.ejs", { posts: posts, user: req.user }); // render the profile page and pass the posts and user data to it
      console.log(req.body.date);
    } catch (err) {
      console.log(err);
    }
  },

  createProfilePic: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await ProfilePicture.create({
        image: result.secure_url,
        cloudinaryId: result.public_id,
        user: req.user.id, // add the user id to the picture
        username: req.user.name, // add the username to the picture
      });
      console.log('image', result.secure_url);
      console.log("Profile Picture has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  getProfilePic: async (req, res) => {
    try {
      const profilePic = await ProfilePicture.find({ user: req.user.id }); // find all pictures by the current user id
      res.render("profile.ejs", { profilePic: profilePic, user: req.user }); // render the profile page and pass the profile pictures and user data to it
      console.log("Profile picture has been loaded")
    } catch (err) {
      console.log(err);
    }
  }
};
