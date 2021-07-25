require('dotenv').config();
const path = require("path")
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocal = require("passport-local").Strategy;
const apiRouter = require("./routes/api/users");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000;
const cors = require("cors")

const app = express();

//DB
const db = process.env.MONGODB_URI;

//connect to DB
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("DB Connected"))
    .catch(err => console.log(err));


//setup middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "client", "build")))

//passport mw
app.use(passport.initialize());
//config for passport
require("./config/passport")(passport);
//routes
app.use("/api", apiRouter);


app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

//Setup server on port 3k1
app.listen(PORT, () => { console.log("Server running on port " + PORT) })