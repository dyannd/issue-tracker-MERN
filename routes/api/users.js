const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
// Load User model
const User = require("../../models/User").User;
const Project = require("../../models/User").Project;
const Issue = require("../../models/User").Issue;

///////////////////////////////////**MIDDLEWARE */////////////////////////////////////////////////////////////
const generateAccessToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name
    };
    // Sign token

    return jwt.sign(
        payload,
        process.env.SECRETAUTHKEY, {
            expiresIn: '15m'
        },

    );
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id, name: user.name, email: user.email },
        process.env.SECRETREFRESHKEY, { expiresIn: '60d' });
};

//middleware to verify the user's identity
const verify = (req, res, next) => {
    //check auth token if still valid
    const authHeader = req.headers.authorization;
    if (authHeader) {
        //extract accesstoken from the header
        const authToken = authHeader.split(" ")[1];
        jwt.verify(authToken, process.env.SECRETAUTHKEY, (err, user) => {
            //if the current acess token is invalid:
            if (err) {
                return res.status(403).json("Token is not valid!");
            }
            //if it is valid, set the decoded (user) to req.user
            req.user = user;
            next();
        });
    }

};

///////////////////////////////////** ROUTINGGGG */////////////////////////////////////////////////////////////
//for refreshing the access token
router.post("/refresh", (req, res) => {
    //take the refresh token from the user from their cookies
    const refreshToken = req.cookies["refreshToken"];
    //send error if there is no token or it's invalid
    if (!refreshToken) return res.status(401).json("You are not authenticated!");
    //if everything is ok, create new access token and send to user
    jwt.verify(refreshToken, process.env.SECRETREFRESHKEY, (err, user) => {
        err && console.log(err);
        const newAccessToken = generateAccessToken(user);
        res.status(200).json({
            ...user,
            accessToken: newAccessToken,
        });
    });
});

//for registration
router.post("/register", (req, res) => {
    //form validation 
    const { errors, isValid } = validateRegisterInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            return res.status(400).json({ email: "Email already exists" });
        } else {
            //create a new user
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            });

            //Hash the password
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    //save to db
                    newUser
                        .save()
                        .then(user => res.status(200).json(user.email))
                        .catch(err => res.status(400).json(err))
                })
            })
        }
    })
})

//for login
router.post("/login", (req, res) => {
    // Form validation
    const { errors, isValid } = validateLoginInput(req.body);
    // Check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    const email = req.body.email;
    const password = req.body.password;
    // Find user by email check if they are in the db
    User.findOne({ email }).then(user => {
        // Check if user exists
        if (!user) {
            return res.status(404)
                .json({ email: "Email not found" });
        }
        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);
                // refreshTokens.push(refreshToken);
                res
                    .status(200)
                    .cookie('refreshToken', refreshToken, { httpOnly: true })
                    .json({
                        success: true,
                        email: user.email,
                        name: user.name,
                        accessToken,
                    })
            } else {
                return res
                    .status(400)
                    .json({ password: "Password incorrect" });
            }
        });
    });
});

//for logout
router.post("/logout", verify, (req, res) => {
    res.status(200)
        .clearCookie('refreshToken')
        .json("You logged out successfully.");
});


//for getting to the main dashboard
router.get("/dashboard", verify, (req, res) => {
    if (!req.user) {
        //if accessToken is valid
        res.status(401).json("You are not authenticated")
    } else {
        //find the user using their email and fetch their issues
        User.findById(req.user.id, { "password": 0 })
            .populate('projects')
            .then(user => {
                if (!user) {
                    res.status(404).json("User not found");
                } else {
                    //send the user all their details 
                    res.status(200).json(user);
                }
            }).catch(error => res.status(400).json(error))
    }
})

//test creating a project with new schema
router.post("/createProject", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        const newProject = new Project({
            name: req.body.projectName,
            admins: [req.user.id]
        });

        newProject.save()
            .then(project => {
                if (project) {
                    User.findByIdAndUpdate(req.user.id, {
                            "$addToSet": {
                                "projects": project._id,
                            }
                        }, { new: true, "fields": { "password": 0 } })
                        .populate('projects')
                        .then(user => {
                            res.status(200).json(user)
                        }).catch(err1 => res.status(400).json(err1))
                } else {
                    res.status(400).json("Project not created")
                }
            }).catch(err2 => res.status(400).json(err2))
    }
})

// const socket = req.app.get('socketIo');
// socket.emit('currentProject', 'world');
router.put("/modifyProject", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        Project.findById(req.body.projectId)
            .then(project => {
                if (project.admins.includes(mongoose.Types.ObjectId(req.user.id))) {
                    project.name = req.body.projectName;
                    project.save()
                        .then(project =>
                            User.findById(req.user.id)
                            .populate('projects')
                            .then(user => {
                                res.status(200).json(user)
                            }).catch(err1 => res.status(400).json(err1))
                        ).catch(err2 => res.status(400).json(err2))
                } else {
                    res.status(403).json("You are not the admin!")
                }
            }).catch(err3 => res.status(400).json(err3))

    }
})

router.delete("/deleteProject", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        //find the project that needed to be deleted
        Project.findById(req.body.projectId)
            .then(project => {
                //if found it, check if the user is the admin
                if (project) {
                    //if the user is the admin, then delete that project
                    if (project.admins.includes(mongoose.Types.ObjectId(req.user.id))) {
                        project
                            .deleteOne()
                            .then(
                                //and delete all issues that are in the project
                                Issue.deleteMany({ project: req.body.projectId })
                                .then(
                                    //also delete that project from the all users who have that project
                                    User.updateMany({}, {
                                        $pull: {
                                            "projects": req.body.projectId
                                        }
                                    }, { new: true })
                                    .then(
                                        //and then return the user's info
                                        User.findById(req.user.id)
                                        .populate('projects')
                                        .then(user => res.status(200).json(user))
                                    ).catch(err1 => res.status(400).json(err1))
                                ).catch(err2 => res.status(400).json(err2))
                            ).catch(err3 => res.status(400).json(err3))
                    }
                    //if not the admin
                    else {
                        res.status(403).json("You are not the admin!")
                    }
                }
                //cant find the project
                else {
                    res.status(404).json("Project not found");
                }
            }).catch(err => res.status(400).json(err))
    }
})

router.post("/createIssue", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        Project.findById(req.body.projectId)
            .populate('issues')
            .then(project => {
                if (project) {
                    //check if the current user is the admin
                    if (project.admins.includes(mongoose.Types.ObjectId(req.user.id))) {
                        const newIssue = new Issue({
                            title: req.body.issueTitle,
                            description: req.body.issueDescription,
                            priority: req.body.issuePriority,
                            solved: req.body.issueSolved,
                            deadline: req.body.issueDeadline,
                            project: req.body.projectId

                        });
                        newIssue.save()
                            .then(issue => {
                                if (issue) {
                                    project.issues.push(newIssue);
                                    project.save()
                                        .then(proj => res.status(200).json(proj))
                                        .catch(err1 => res.status(400).json(err1))
                                } else {
                                    res.status(400).json("Cannot create the issue")
                                }
                            }).catch(err2 => res.status(400).json(err2))
                    } else {
                        res.status(403).json("You are not the admin")
                    }
                }
            }).catch(err3 => res.status(400).json(err3))

    }
})

router.put("/modifyIssue", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        const newModifiedIssue = {
            title: req.body.issueTitle,
            description: req.body.issueDescription,
            priority: req.body.issuePriority,
            solved: req.body.issueSolved,
            deadline: req.body.issueDeadline
        }

        Project.findById(req.body.projectId)
            .then(project => {
                if (project) {
                    //check if the current user is the admin
                    if (project.admins.includes(mongoose.Types.ObjectId(req.user.id))) {
                        Issue.findByIdAndUpdate(req.body.issueId, {
                                "$set": {
                                    "title": newModifiedIssue.title,
                                    "description": newModifiedIssue.description,
                                    "priority": newModifiedIssue.priority,
                                    "solved": newModifiedIssue.solved,
                                    "deadline": newModifiedIssue.deadline
                                }
                            }, { new: true })
                            .populate('users', 'name email')
                            .then(issue => res.status(200).json(issue))
                            .catch(err1 => res.status(400).json(err1))
                    } else {
                        //if not the admin, check if the  user is assigned to the issue
                        Issue.findById(req.body.issueId)
                            .then(issue => {
                                if (issue.users.includes(mongoose.Types.ObjectId(req.user.id))) {
                                    issue.solved = newModifiedIssue.solved;
                                    issue.save()
                                        .then(iss => {
                                            iss.populate('users', 'name email').execPopulate()
                                                .then(returnIssue => res.status(200).json(returnIssue))
                                        })
                                        .catch(err1 => res.status(400).json(err1))

                                } else {
                                    res.status(403).json("You are not assigned to this issue!")
                                }
                            })
                            .catch(err2 => res.status(400).json(err2))
                    }
                }
            }).catch(err3 => res.status(400).json(err3))
    }
})

router.delete("/deleteIssue", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        Project.findById(req.body.projectId)
            .then(project => {
                if (project) {
                    //check if the current user is the admin
                    if (project.admins.includes(mongoose.Types.ObjectId(req.user.id))) {
                        //if yes delete the issue from the project
                        const index = project.issues.indexOf(mongoose.Types.ObjectId(req.body.issueId));
                        project.issues.splice(index, 1)
                        project.save()
                            .then(proj => {
                                proj
                                    .populate('admins', 'name email')
                                    .populate('users', 'name email')
                                    .populate('issues')
                                    .execPopulate()
                                    .then(returnProject => {
                                        //delete the issue itself
                                        Issue.findByIdAndDelete(req.body.issueId)
                                            .then(res.status(200).json(returnProject))
                                            .catch(err1 => res.status(400).json(err1))
                                    })
                            })
                    } else {
                        res.status(403).json("You are not the admin")
                    }
                } else {
                    res.status(404).json("Project not found!")
                }
            }).catch(err2 => res.status(400).json(err2))

    }
})


router.get("/getProject/:id", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        Project.findById(req.params.id)
            .populate('issues')
            .populate('admins', 'name email')
            .populate('users', 'name email')
            .then(project => res.status(200).json(project))
            .catch(error => res.status(400).json(error))
    }
})

router.get("/getIssue/:id", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        Issue.findById(req.params.id)
            .populate('users', 'name email')
            .then(issue => res.status(200).json(issue))
            .catch(error => res.status(400).json(error))
    }
})


//for adding another user to the current project
router.post("/addUserToProject", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else if (req.user.email === req.body.addedEmail) {
        res.status(400).json("You cannot add yourself")
    } else {
        //first FIND the user that is supposed to be added
        User
            .findOne({ email: req.body.addedEmail })
            .then(foundUser => {
                //continue if we found one
                if (foundUser) {
                    //IF THE ADDED ROLE IS ADMIN
                    if (req.body.addedRole === "admin") {
                        if (foundUser.projects.includes(req.body.projectId)) {
                            res.status(400).json("User already added!")
                        } else {
                            foundUser.projects.push(mongoose.Types.ObjectId(req.body.projectId))
                            foundUser
                                .save()
                                .then(foundUser => {
                                    Project.findByIdAndUpdate(req.body.projectId, {
                                            $addToSet: { "admins": foundUser }
                                        }, { new: true })
                                        .populate('admins', 'name email')
                                        .populate('users', 'name email')
                                        .then(project => {
                                            if (project) {
                                                res.status(200).json(project)
                                            } else {
                                                res.status(404).json("Project not found")
                                            }
                                        }).catch(err2 => res.status(400).json(err2))
                                }).catch(err1 => res.status(400).json(err1))
                        }
                        // IF THE ADDED ROLE IS USER
                    } else if (req.body.addedRole === "user") {
                        if (foundUser.projects.includes(req.body.projectId)) {
                            res.status(400).json("User already added!")
                        } else {
                            foundUser.projects.push(mongoose.Types.ObjectId(req.body.projectId))
                            foundUser.save()
                                .then(
                                    Project.findByIdAndUpdate(req.body.projectId, {
                                        $addToSet: { "users": foundUser }
                                    }, { new: true })
                                    .populate('admins', 'name email')
                                    .populate('users', 'name email')
                                    .then(project => {
                                        if (project) {
                                            res.status(200).json(project)
                                        } else {
                                            res.status(404).json("Project not found")
                                        }
                                    }).catch(err2 => res.status(400).json(err2))
                                ).catch(err1 => res.status(400).json(err1))
                        }
                    }
                } else {
                    res.status(404).json("User not found")
                }
            }).catch(err3 => res.status(400).json(err3))
    }
})


//for deleting current user from the project 
router.delete("/deleteUserFromProject", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    }

    //can only be deleted by admins
    else {
        Project.findById(req.body.projectId)
            .then(project => {
                if (project) {
                    //check if the current user is the admin
                    if (project.admins.includes(mongoose.Types.ObjectId(req.user.id))) {
                        //if yes, remove the deleted Id from the admins/users array
                        if (project.admins.includes(mongoose.Types.ObjectId(req.body.deletedId))) {
                            const index = project.admins.indexOf(mongoose.Types.ObjectId(req.body.deletedId));
                            project.admins.splice(index, 1)
                            project.save()
                                .then(
                                    project => {
                                        //delete the project from that user's projects array too
                                        User.findByIdAndUpdate(req.body.deletedId, {
                                            $pull: {
                                                "projects": project._id
                                            }
                                        }, { new: true })

                                        .then(
                                            //remove that user from all the issues that are in that project 
                                            Issue.updateMany({ project: mongoose.Types.ObjectId(req.body.projectId) }, {
                                                $pull: {
                                                    "users": req.body.deletedId
                                                }
                                            }, { new: true })
                                            .then(
                                                project
                                                .populate('admins', 'name email')
                                                .populate('users', 'name email')
                                                .execPopulate()
                                                .then(proj => res.status(200).json(proj))
                                            )
                                        ).catch(err2 => res.status(400).json(err2))
                                    }).catch(err3 => res.status(400).json(err3))
                        } else if (project.users.includes(mongoose.Types.ObjectId(req.body.deletedId))) {
                            const index = project.users.indexOf(mongoose.Types.ObjectId(req.body.deletedId));
                            project.users.splice(index, 1)
                            project.save()
                                .then(
                                    project => {
                                        //delete the project from that user's projects array too
                                        User.findByIdAndUpdate(req.body.deletedId, {
                                                $pull: {
                                                    "projects": project._id
                                                }
                                            }, { new: true })
                                            .then(
                                                //remove that user from all the issues that are in that project 
                                                Issue.updateMany({ project: mongoose.Types.ObjectId(req.body.projectId) }, {
                                                    $pull: {
                                                        "users": req.body.deletedId
                                                    }
                                                }, { new: true })
                                                .then(
                                                    project
                                                    .populate('admins', 'name email')
                                                    .populate('users', 'name email')
                                                    .execPopulate()
                                                    .then(proj => res.status(200).json(proj))
                                                )
                                            ).catch(err2 => res.status(400).json(err2))
                                    }).catch(err3 => res.status(400).json(err3))
                        }
                    } else {
                        res.status(403).json("You are not the admin!")
                    }
                } else {
                    res.status(404).json("Project not found!")
                }
            }).catch(err1 => res.status(400).json(err1))
    }
})

router.post("/assignUserToIssue", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        //find the current project 
        Project.findById(req.body.projectId)
            .then(project => {
                if (project) {
                    //check if the current user is the admin of the project
                    if (project.admins.includes(mongoose.Types.ObjectId(req.user.id))) {
                        // if the user is the admin, check if the user is already added
                        Issue.findById(req.body.issueId)
                            .then(issue => {
                                if (issue.users.includes(req.body.addedUserId)) {
                                    res.status(400).json("User already assigned")
                                } else {
                                    issue.users.push(mongoose.Types.ObjectId(req.body.addedUserId))
                                    issue.save()
                                        .then(iss => {
                                            iss.populate('users', 'name email').execPopulate()
                                                .then(returnIssue => res.status(200).json(returnIssue))
                                                .catch(err1 => res.status(400).json(err1))
                                        }).catch(err2 => res.status(400).json(err2))
                                }
                            }).catch(err3 => res.status(400).json(err3))
                    } else {
                        res.status(403).json("You are not the admin!")
                    }
                } else {
                    res.status(404).json("Project not found")
                }
            }).catch(err4 => res.status(400).json(err4))
    }
})

router.delete("/removeUserFromIssue", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        //find the current project 
        Project.findById(req.body.projectId)
            .populate('issues')
            .then(project => {
                if (project) {
                    //check if the current user is the admin of the project
                    if (project.admins.includes(mongoose.Types.ObjectId(req.user.id))) {
                        // if the user is the admin, then remove the user from the issue
                        Issue.findByIdAndUpdate(req.body.issueId, {
                                $pull: { "users": req.body.removedUserId }
                            }, { new: true })
                            .populate('users', 'name email')
                            .then(issue => res.status(200).json(issue))
                            .catch(err1 => res.status(400).json(err1))
                    } else {
                        res.status(403).json("You are not the admin!")
                    }
                } else {
                    res.status(404).json("Project not found")
                }
            }).catch(err2 => res.status(400).json(err2))
    }
})

router.post("/addCommentToIssue", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        //get the issue
        const newComment = {
            commenter: {
                name: req.user.name,
                id: req.user.id
            },
            details: req.body.commentDetail
        };
        Issue.findByIdAndUpdate(req.body.issueId, {
                $push: { 'comments': newComment }
            }, { new: true })
            .populate('users', 'name email')
            .then(issue => res.status(200).json(issue))
            .catch(err1 => res.status(400).json(err1))
    }
})

router.delete("/deleteCommentFromIssue", verify, (req, res) => {
    if (!req.user) {
        res.status(401).json("You are not authenticated");
    } else {
        Project.findById(req.body.projectId)
            .then(project => {
                //if the user is the admin of the project
                if (project.admins.includes(mongoose.Types.ObjectId(req.user.id))) {
                    Issue.findByIdAndUpdate(req.body.issueId, {
                            $pull: { 'comments': { _id: req.body.commentId } }
                        }, { new: true })
                        .populate('users', 'name email')
                        .then(issue => res.status(200).json(issue))
                        .catch(err1 => {
                            res.status(400).json(err1);
                        })
                } else {
                    res.status(400).json("You are not the admin")
                }
            }).catch(err2 => res.status(400).json(err2))
    }
})

module.exports = router;