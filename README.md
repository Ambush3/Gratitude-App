# About the project
Gratitude App is an App I made where users can sign up, login, and upload a gratitude daily. 
You can also upload images for your post, which are uploaded to cloudinary.  
You can change your profile picture, and change password.

Currently working on:
1. Reset password. Send a reset password link to your email using nodemailer, which verifies if you have the right reset token, and resetting your password on a reset password page.
2. Users can get an email that will send them a gratitude via email that they may have posted   
in the past
3. Users can select a date within the application, and see what post/grattitude comes up for that selected date.  

# Install

`npm install`

---

# Things to add

- Create a `.env` file in config folder and add the following as `key = value`
  - PORT = 2121 (can be any port example: 3000)
  - DB_STRING = `your database URI`
  - CLOUD_NAME = `your cloudinary cloud name`
  - API_KEY = `your cloudinary api key`
  - API_SECRET = `your cloudinary api secret`

---

# Run

`npm start`
`nodemon server.js`
