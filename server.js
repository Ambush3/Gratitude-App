const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport"); // passport is a middleware for authentication
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override"); // for PUT and DELETE
const flash = require("express-flash");
const logger = require("morgan"); // for logging requests
const connectDB = require("./config/database");
const mainRoutes = require("./routes/main");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");

//Use .env file in config folder
require("dotenv").config({ path: "./config/.env" });

// Passport config
require("./config/passport")(passport);

//Connect To Database
connectDB();


//Using EJS for views
app.set("view engine", "ejs");

//Static Folder
app.use(express.static("public"));

//Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Logging
app.use(logger("dev"));

//Use forms for put / delete
app.use(methodOverride("_method"));

// Setup Sessions - stored in MongoDB
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Use flash messages for errors, info, ect...
app.use(flash());

//Setup Routes For Which The Server Is Listening
app.use("/", mainRoutes);
app.use("/post", postRoutes);
app.use("/comment", commentRoutes);
app.use("/forgot-password", mainRoutes);
app.use("/reset-password", mainRoutes);
app.use("/daily-motivation", mainRoutes);
app.use("/profile", mainRoutes);
app.use("/login", mainRoutes);
app.use("/logout", mainRoutes);
app.use("/signup", mainRoutes);
app.use("/edit-profile", mainRoutes);


//Server Running
app.listen(process.env.PORT, () => {
  console.log("Server is running, you better catch it!");
});
