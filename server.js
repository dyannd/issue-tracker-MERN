require('dotenv').config();
const path = require("path")
const express = require("express");
const mongoose = require("mongoose");
const apiRouter = require("./routes/api/users");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT;
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        cors: true,
        origins: ["*"],
    }
});
// Load User model
const User = require("./models/User").User;
const Project = require("./models/User").Project;


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
//init socket
app.set('socketIo', io);
//when in production
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

//whenever someone connects to the app 
let connectedUsers = [];
io.on('connection', (socket) => {
    socket.on('joinUser', id => {
        connectedUsers.push({ id, socketId: socket.id });
        console.log({ connectedUsers });
    })

    socket.on('editProject', data => {
        const { project, userId } = data
        //check if any current user in the project is also online;
        let allUsersInProject = project.users.map(user => user._id);
        let allAdminsInProject = project.admins.map(admin => admin._id);

        //all the people not including the one editing the project
        let projectPeople = allUsersInProject.concat(allAdminsInProject).filter(all => all !== userId);
        //now determine all people in the project that are online
        let usersInProjectOnline = connectedUsers.filter(connectedUser =>
            projectPeople.includes(connectedUser.id));

        //send the update to those people
        usersInProjectOnline.map(onliner => {
            User.findById(onliner.id)
                .populate('projects')
                .then(user => {
                    socket.to(onliner.socketId).emit("updateUserProjectRealtime", user);
                })
                .catch(err => console.log("Error at Socket editProject ", err))
        });
    });

    socket.on('deleteProject', data => {
        const { project, userId } = data
        //check if any current user in the project is also online;
        let allUsersInProject = project.users.map(user => user._id);
        let allAdminsInProject = project.admins.map(admin => admin._id);

        //all the people not including the one editing the project
        let projectPeople = allUsersInProject.concat(allAdminsInProject).filter(all => all !== userId);
        //now determine all people in the project that are online
        let usersInProjectOnline = connectedUsers.filter(connectedUser =>
            projectPeople.includes(connectedUser.id));

        //send the update to those people
        usersInProjectOnline.map(onliner => {
            User.findById(onliner.id)
                .populate('projects')
                .then(user => {
                    socket.to(onliner.socketId).emit("deleteUserProjectRealtime", {
                        userDetail: user,
                        projectDetail: project
                    })
                }).catch(err => console.log("Error at Socket deleteProject ", err))
        });
    })


    socket.on('createIssue', data => {
        const { project, userId } = data
        console.log(project);
        console.log(userId);
        //all the people not including the one editing the project
        let projectPeople = project.users.concat(project.admins).filter(all => all !== userId);
        //now determine all people in the project that are online
        let usersInProjectOnline = connectedUsers.filter(connectedUser =>
            projectPeople.includes(connectedUser.id));

        console.log(usersInProjectOnline);
        //send the update to those people
        usersInProjectOnline.map(onliner => {
            socket.to(onliner.socketId).emit("createIssueRealtime", project);

        })
    })

    socket.on('modifyIssue', (data) => {
        const { project, userId, issue } = data;
        //check if any current user in the project is also online;
        let allUsersInProject = project.users.map(user => user._id);
        let allAdminsInProject = project.admins.map(admin => admin._id);
        //all the people not including the one editing the project
        let projectPeople = allUsersInProject.concat(allAdminsInProject).filter(all => all !== userId);
        //now determine all people in the project that are online
        let usersInProjectOnline = connectedUsers.filter(connectedUser =>
            projectPeople.includes(connectedUser.id));
        console.log(usersInProjectOnline);
        //send the update to those people
        usersInProjectOnline.map(onliner => {
            socket.to(onliner.socketId).emit("modifyIssueRealtime", { projectData: project, issueData: issue });
        })
    })

    socket.on('removeIssue', data => {
        const { project, userId, issueId } = data
        //check if any current user in the project is also online;
        let allUsersInProject = project.users.map(user => user._id);
        let allAdminsInProject = project.admins.map(admin => admin._id);

        //all the people not including the one editing the project
        let projectPeople = allUsersInProject.concat(allAdminsInProject).filter(all => all !== userId);


        //now determine all people in the project that are online
        let usersInProjectOnline = connectedUsers.filter(connectedUser =>
            projectPeople.includes(connectedUser.id));
        console.log(usersInProjectOnline);

        //send the update to those people
        usersInProjectOnline.map(onliner => {
            socket.to(onliner.socketId).emit("deleteIssueRealtime", { projectData: project, issueId: issueId });
        })

    })


    socket.on('assignUserIssue', data => {
        const { project, addedId } = data;
        console.log("Helloooo");
        //now determine if the added user is online
        let usersInProjectOnline = connectedUsers.filter(connectedUser =>
            connectedUser.id === addedId);

        //send the update to that user
        usersInProjectOnline.map(onliner => {
            Project.findById(project._id)
                .populate('issues')
                .then(proj => {
                    socket.to(onliner.socketId).emit("assignUserIssueRealtime", proj);
                    User.findById(onliner.id).then(user => {
                        socket.to(onliner.socketId).emit("updateNoti", user);
                    })
                })
        })
    })

    socket.on('removeUserIssue', data => {
        const { project, removedId, issueId } = data;
        //now determine if the removed user is online
        let usersInProjectOnline = connectedUsers.filter(connectedUser =>
            connectedUser.id === removedId);

        //send the update to that user
        usersInProjectOnline.map(onliner => {
            Project.findById(project._id)
                .populate('issues')
                .then(proj => {
                    socket.to(onliner.socketId).emit("removeUserIssueRealtime", { projectData: proj, issueId: issueId });
                    User.findById(onliner.id).then(user => {
                        socket.to(onliner.socketId).emit("updateNoti", user);
                    })
                })
        })
    })

    socket.on('modifyComment', data => {
        const { project, userId, issue } = data;
        //check if any current user in the project is also online;
        let allUsersInProject = project.users.map(user => user._id);
        let allAdminsInProject = project.admins.map(admin => admin._id);

        //all the people not including the one editing the project
        let projectPeople = allUsersInProject.concat(allAdminsInProject).filter(all => all !== userId);


        //now determine all people in the project that are online
        let usersInProjectOnline = connectedUsers.filter(connectedUser =>
            projectPeople.includes(connectedUser.id));
        console.log(usersInProjectOnline);

        //send the update to those people
        usersInProjectOnline.map(onliner => {
            socket.to(onliner.socketId).emit("modifyCommentRealtime", { projectData: project, issueData: issue });
            User.findById(onliner.id).then(user => {
                socket.to(onliner.socketId).emit("updateNoti", user);
            })
        })
    })

    socket.on('disconnect', () => {
        connectedUsers = connectedUsers.filter(connected =>
            connected.socketId !== socket.id)
        console.log('A user disconnected', { connectedUsers })
    })
})

http.listen(PORT, () => { console.log("Server running on port " + PORT) })