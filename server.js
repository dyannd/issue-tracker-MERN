require('dotenv').config();
const path = require("path")
const express = require("express");
const mongoose = require("mongoose");
const apiRouter = require("./routes/api/users");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000;
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

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "client", "build")))

//routes
app.use("/api", apiRouter);


app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});


app.listen(PORT, () => { console.log("Server running on port " + PORT) })