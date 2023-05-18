const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const ProfilePicture = require("../models/ProfilePicture");
const User = require("../models/User");
const SavedPost = require("../models/SavedPosts");

module.exports = {
  getProfile: async (req, res) => {
  //   try {
  //     const posts = await Post.find({ user: req.user.id }); // find all posts by the current user id
  //     const savedPosts = await SavedPost.find({ user: req.user.id }).populate('post'); // find all saved posts by the current user id
  //     const profilePic = await ProfilePicture.find({ user: req.user.id, profilePicture: req.user.profilePicture });
  //     const type = req.query.type || 'posts'; // Get the type from the query parameter
  //     res.render("profile.ejs", { posts: posts, savedPosts: savedPosts, profilePic: profilePic, user: req.user, type: type }); // render the profile page and pass the posts, savedPosts, and user data to it

  //     console.log('these are the saved posts', savedPosts);
  //   } catch (err) {
  //  console.log   (err);
  //   }
    try {
      const posts = await Post.find({ user: req.user.id });
      const savedPosts = await SavedPost.find({ user: req.user.id }).populate('post');

      const profilePic = await ProfilePicture.find({ user: req.user.id, profilePicture: req.user.profilePicture });
      res.render("profile.ejs", { posts: posts, savedPosts: savedPosts, profilePic: profilePic, user: req.user, type: req.query.type || 'posts' });
    } catch (err) {
      console.log(err);
    }
  },

  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id); // find the post by its id
      const comments = await Comment.find({ post: req.params.id }).sort({ createdAt: "desc" }).lean(); // find all comments for the post and sort them by the date they were created
      const profilePic = await ProfilePicture.find({ user: req.user.id, profilePicture: req.user.profilePicture });
      res.render("post.ejs", { post: post, user: req.user, comments: comments, profilePic: profilePic }); // render the post page and pass in the post, user, comments, and profilePic
    } catch (err) {
      console.log(err);
    }
  },
  
  savePost: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const post = await Post.findById(req.params.id);

      console.log('this is the saved post', post);

      // Check if the post is already saved by the user
      const existingSavedPost = await SavedPost.findOne({ user: user._id, post: post._id });

      if (!existingSavedPost) {
        // Create a new SavedPost document
        const savedPost = new SavedPost({
          user: user._id,
          post: post._id,
        });

        await savedPost.save();
      }

      res.redirect("back");
    } catch (err) {
      console.error(err);
      return res.render("error/500");
    }
  },

  unsavePost: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const post = await Post.findById(req.params.id);

      // Find and remove the SavedPost with the given user ID and post ID
      await SavedPost.findOneAndRemove({ user: user._id, post: post._id });

      res.redirect("back");
    } catch (err) {
      console.error(err);
    }
  },
  
  createPost: async (req, res) => {
    try {
      // check if image is uploaded
      if (!req.file) {
        return res.status(400).send("Please upload an image");
      }

      // upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      // create a new post in the database
      await Post.create({
        title: req.body.title,
        caption: req.body.caption,
        image: result.secure_url, // use the secure URL returned by cloudinary
        cloudinaryId: result.public_id, // save the public id returned by cloudinary
        user: req.user.id,
        likes: 0,
      });

      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
      res.status(500).send("Internal server error");
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
      let post = await Post.findById({ _id: req.params.id });
      await cloudinary.uploader.destroy(post.cloudinaryId);
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting the post' });
    }
  },

  updatePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      post.title = req.body.title || post.title;
      post.caption = req.body.caption || post.caption;
      if (req.file) {
        post.image = req.file.filename;
      }

      const validationResult = post.validateSync();
      if (validationResult) {
        const errors = Object.keys(validationResult.errors).map((key) => ({
          field: key,
          message: validationResult.errors[key].message,
        }));
        return res.status(400).json({ errors });
      }

      await post.save();

      res.redirect('/profile');
    } catch (err) {
      console.log(err);
      res.status(500).send("Internal server error");
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
      if (!req.file) {
        req.flash("errors", { msg: "Please select an image to upload." });
        return res.redirect("/edit-profile");
      }
      const result = await cloudinary.uploader.upload(req.file.path);

      await ProfilePicture.create({
        image: result.secure_url,
        cloudinaryId: result.public_id,
        user: req.user.id,
        username: req.user.name,
      });

      const profilePic = await ProfilePicture.find({ user: req.user.id });
      if (profilePic.length > 1) {
        await cloudinary.uploader.destroy(profilePic[0].cloudinaryId);
        await ProfilePicture.remove({ _id: profilePic[0]._id });
      }

      console.log('image', result.secure_url);
      console.log("Profile Picture has been added!");
      res.redirect("/profile");
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
