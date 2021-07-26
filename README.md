# Issue-tracker-MERN
My first project built using the MERN stack - Mongo, Express, React, and Node. The app helps you keep track of your ongoing projects, as well as adding participants to those projects and assign them issues.

## Clone my project
```terminal
$ git clone https://github.com/dyannd/issue-tracker-MERN.git
$ npm i
```
## ENV variables
Change these with your own configuration in a .env file!
```terminal
$ process.env.MONGOURI="your mongoDB url here"
$ process.env.SECRETAUTHKEY="your secret key 1 here"
$ process.env.SECRETREFRESHKEY="your secret key 2 here"
```
## Client-side (PORT: 3000)
```terminal
$ cd client   // go to client folder
$ npm i       // npm install packages
$ npm start   //start the development server at port 3000

```

## Server-side (add your own port in .env)
```terminal
$ npm i      // npm install packages
$ nodemon server.js //run server at any port you want


