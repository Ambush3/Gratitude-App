const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const ProfilePicture = require("../models/ProfilePicture");
const User = require("../models/User");

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
      console.log('image', result.secure_url);
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
    
  // savePost to a collection of saved posts to be viewed later
  // savePost: async (req, res) => {
  //   try {
  //     // Find post by id
  //     let post = await Post.findById({ _id: req.params.id }); // find the post by its id and store it in the post variable
      
  //     // Save post to db
  //     await Post.save({ _id: req.params.id });  // Save post to db
  //     console.log("Saved Post");
  //     res.redirect("/profile"); // redirect to the profile page
  //   } catch (err) {
  //     res.redirect("/profile");
  //   }
  // },

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
      if(!req.file) {
        return res.render("edit-profile.ejs", { msg: "Please select an image to upload", user: req.user });
      }
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path); // upload the image to cloudinary using the path to the image

      await ProfilePicture.create({ // create a new profile picture using the ProfilePicture model and pass in the image, cloudinaryId and user id
        image: result.secure_url, // add the image url to the post
        cloudinaryId: result.public_id, // add the cloudinary id to the post
        user: req.user.id, // add the user id to the picture
        username: req.user.name, // add the username to the picture
      });

      // if there are more than one profile picture, delete the oldest one
      const profilePic = await ProfilePicture.find({ user: req.user.id }); // find all profile pictures by the current user id
      if (profilePic.length > 1) { // if there are more than one profile picture
        await cloudinary.uploader.destroy(profilePic[0].cloudinaryId); // delete the image from cloudinary using the cloudinaryId
        await ProfilePicture.remove({ _id: profilePic[0]._id }); // delete the profile picture from the database
      }

      console.log('image', result.secure_url); // log the image url to the console
      console.log("Profile Picture has been added!"); // log a message to the console
      res.redirect("/profile"); // redirect to the profile page
    } catch (err) {
      console.log(err);
    }
  },
  getProfilePic: async (req, res) => {
    try {
      const profilePic = await ProfilePicture.find({ user: req.user.id, profilePicture: req.user.profilePicture});
      res.render("profile.ejs", { profilePic: profilePic, user: req.user }); // render the profile page and pass the posts and user data to it
      // find profile pic by the current user id

    } catch (err) {
      console.log(err);
    }
  }
};
