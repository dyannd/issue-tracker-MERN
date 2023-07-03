import axios from 'axios';
import jwt_decode from 'jwt-decode';
import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import io from 'socket.io-client';
import './Dashboard.css';
import DisplayIssue from './DisplayIssue';
import DisplayProject from './DisplayProject';
import NavBar from './NavBar';
import PopUp from './PopUp';


function Dashboard(props) {

    const [currentUser, setCurrentUser] = useState("");
    //currentProject can help handle the render of its issues.
    const [currentProject, setCurrentProject] = useState(null);
    const [currentIssueList, setCurrentIssueList] = useState([]);
    const [currentIssue, setCurrentIssue] = useState(null);
    const [sortOption, setSortOption] = useState("date-as");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isClickedCreateProject, setIsClickedCreateProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [newIssueTitle, setNewIssueTitle] = useState("");
    const [newIssueDescription, setNewIssueDescription] = useState("");
    const [newIssuePriority, setNewIssuePriority] = useState("");
    const [newIssueSolved, setNewIssueSolved] = useState("");
    const [newIssueDeadline, setNewIssueDeadline] = useState("");
    const [isLoadingIssue, setIsLoadingIssue] = useState(false);
    const [isLoadingProject, setIsLoadingProject] = useState(false);
    const [isLoadingLogOut, setIsLoadingLogOut] = useState(false);
    const [showDone, setShowDone] = useState(true);
    const [displayError, setDisplayError] = useState(null);
    const [displayIssuesOnMobile, setDisplayIssesOnMobile] = useState(false);
    const [noti, setNoti] = useState([]);
    const history = useHistory();
    const SERVER = "https://itrack-backend.onrender.com";
    // "https://mernissuetracker.herokuapp.com/"
    // "localhost:8888/";
    const socket = io(SERVER);

    //state for getting the windows'width
    const [width, setWidth] = useState(window.innerWidth);

    //resize listener
    React.useEffect(() => {
        window.addEventListener("resize", () => {
            setWidth(window.innerWidth);
        })
    }, [])

    /************************MIDDLEWARE*********************** */
    /**CHECK EXPIRY MUST BE USED WITH EVERY FUNCTION THAT MAKES API CALLS */
    async function checkExpiry() {
        //first of all check token expiry
        console.log("Checking expiry...")
        let currentDate = new Date();
        if (localStorage.getItem("accessToken")) {
            const decodedToken = jwt_decode(localStorage.getItem("accessToken"));
            //if expired, then call refreshToken to renew the access token
            async function getNewToken() {
                if (decodedToken.exp * 1000 < currentDate.getTime()) {
                    await axios({
                        url: "/api/refresh",
                        method: "POST",
                        withCredentials: true
                    }).then((res) => {
                        //if refreshToken is still good, set the new accessToken to localStorage
                        if (res.status === 200) {
                            localStorage.setItem("accessToken", res.data.accessToken);
                            console.log("Access Token has been renewed!");
                        }

                    }).catch((err) => {
                        history.push("/loginOrRegister")
                        console.log(err)
                    })
                }
                else {
                    console.log("Still good!")
                }
            };
            await getNewToken()
            return ("Complete checking!");
        } else {
            history.push("/loginOrRegister")
        }

    }

    //SORTING THE ISSUES BASED ON SELECTED CRITERIA, TAKE IN THE SORTOPTION AND THE CURRENT ISSUE LIST, CAN BE USED TO 
    //KEEP THE SORTING CONSISTENCY AFTER EACH API CALLS
    function handleSort(option, currentIssueList) {
        const sortValue = option;
        //default, sort by date ascending
        function compareDateAs(issueA, issueB) {
            const dateA = new Date(issueA.date);
            const dateB = new Date(issueB.date);
            if (dateA < dateB) return -1
            if (dateA > dateB) return 1
            return 0
        }


        function compareDateDes(issueA, issueB) {
            const dateA = new Date(issueA.date);
            const dateB = new Date(issueB.date);
            if (dateA < dateB) return 1
            if (dateA > dateB) return -1
            return 0
        }

        function compareDeadSoonest(issueA, issueB) {
            const dateA = issueA.deadline !== undefined ? Date.parse(issueA.deadline) : Date.parse(issueA.date) + 1000000000;
            const dateB = issueB.deadline !== undefined ? Date.parse(issueB.deadline) : Date.parse(issueB.date) + 1000000000;
            if (dateA < dateB) return -1
            if (dateA > dateB) return 1
            return 0
        }


        function compareDeadLongest(issueA, issueB) {
            const dateA = new Date(issueA.deadline);
            const dateB = new Date(issueB.deadline);
            if (dateA < dateB) return 1
            if (dateA > dateB) return -1
            return 0
        }





        //default, sort by unsolved -> done
        function compareSolvedDes(issueA, issueB) {
            const solA = issueA.solved === "Unsolved" ? 2 : issueA.solved === "In Progress" ? 1 : 0;
            const solB = issueB.solved === "Unsolved" ? 2 : issueB.solved === "In Progress" ? 1 : 0;
            if (solA < solB) return 1
            if (solA > solB) return -1
            return 0
        }

        function compareSolvedAs(issueA, issueB) {
            const solA = issueA.solved === "Unsolved" ? 2 : issueA.solved === "In Progress" ? 1 : 0;
            const solB = issueB.solved === "Unsolved" ? 2 : issueB.solved === "In Progress" ? 1 : 0;
            if (solA < solB) return -1
            if (solA > solB) return 1
            return 0
        }

        //default, sort by ascending priority
        function comparePriorityAs(issueA, issueB) {
            const priA = issueA.priority === "High" ? 2 : issueA.priority === "Medium" ? 1 : 0;
            const priB = issueB.priority === "High" ? 2 : issueB.priority === "Medium" ? 1 : 0;
            if (priA < priB) return -1
            if (priA > priB) return 1
            //if same priority, sort longer deadlines first
            if (priA === priB) {
                if (compareDeadLongest(issueA, issueB) === 0) {
                    //if same state, sort by ascending date
                    return compareSolvedAs(issueA, issueB);
                } else {
                    return compareDeadLongest(issueA, issueB);
                }
            }
        }

        //default, sort by descending priority
        function comparePriorityDes(issueA, issueB) {
            const priA = issueA.priority === "High" ? 2 : issueA.priority === "Medium" ? 1 : 0;
            const priB = issueB.priority === "High" ? 2 : issueB.priority === "Medium" ? 1 : 0;
            if (priA < priB) return 1
            if (priA > priB) return -1
            //if same priority, sort oldest dates first (ascending)
            if (priA === priB) {
                if (compareDeadSoonest(issueA, issueB) === 0) {
                    //if same deadline, sort by ascending state
                    return compareSolvedDes(issueA, issueB);
                } else {
                    return compareDeadSoonest(issueA, issueB);
                }
            }
        }
        //the real sorting function
        function sortingIssue() {
            //create a clone of current issue list so it isnt get mutated
            const sorted = [...currentIssueList];
            if (sortValue === "date-as") {
                return sorted.sort(compareDateAs);

            } else if (sortValue === "date-des") {
                return sorted.sort(compareDateDes)

            } else if (sortValue === "pri-as") {
                return sorted.sort(comparePriorityAs);

            } else if (sortValue === "pri-des") {
                //if reverse the array, the date will also get descended, so must make a new compare function!
                return sorted.sort(comparePriorityDes);
            } else if (sortValue === "end-des") {
                return sorted.sort(compareDeadSoonest);
            }
        }
        const newIssueArray = sortingIssue();
        setCurrentIssueList(newIssueArray);
    }


    //store previous currentProject state in prevProject and prevIssue, to assist front end realtime logic
    const prevProject = useRef(null);
    const prevIssue = useRef(null);
    useEffect(() => {
        prevProject.current = currentProject;
        prevIssue.current = currentIssue;
    }, [currentProject, currentIssue]);

    //close socket on dismount
    useEffect(() => {
        return () => socket.close();
    }, []);

    /**GET REALTIME UPDATES FROM SOCKET IO */
    useEffect(() => {
        //for updating the project, React takes modded user info and set the state. the socket 
        //listens for tasks like adding user to prj, modifying proj, and deleting project
        socket.on("updateUserProjectRealtime", userData => {
            setCurrentUser(userData);
            setCurrentProject(null);
            //update noti
            setNoti(userData.notifications);
        })

        //for deleting the project, React takes modded user info and the deleted project id
        socket.on("deleteUserProjectRealtime", data => {
            const readableData = JSON.parse(JSON.stringify(data));
            const user = readableData.userDetail;
            const project = readableData.projectDetail;

            //if the previous project is being opened!
            if (project._id === prevProject.current._id) {
                setCurrentIssueList([]);
                setCurrentProject(null);
                setCurrentIssue(null);
            }
            //set the current user as received from socket.
            setCurrentUser(user);
        })

        //creating an issue will display it to all the users in project
        socket.on("createIssueRealtime", projectData => {
            //only update realtime IF AND ONLY IF user is in the same project and not having any issues open
            if (prevProject.current && prevProject.current._id === projectData._id && !prevIssue.current) {
                setCurrentIssueList(projectData.issues);
                console.log("Updated issue list since a user changes it!")
            }
        })

        //modify an issue will display it to all the users in the project and in that issue
        socket.on("modifyIssueRealtime", data => {
            const readableData = JSON.parse(JSON.stringify(data));
            const issueData = readableData.issueData;
            const projectData = readableData.projectData;
            //only update realtime IF AND ONLY IF user is in the same project and not having any issues open 
            //OR having exactly that issue opened
            if (prevProject.current && prevProject.current._id === projectData._id && !prevIssue.current) {
                handleClickOnProject(projectData._id);
                console.log("Updated issue list since a user changes it!")
            } else if (prevIssue.current && issueData._id === prevIssue.current._id) {
                setCurrentIssue(issueData);
                console.log("Updated issue list since a user changes it!")
            }
        })

        //deleting an issue will display it to all users in the project and currently working on that issue
        socket.on("deleteIssueRealtime", data => {
            const readableData = JSON.parse(JSON.stringify(data));
            const issueId = readableData.issueId;
            const projectData = readableData.projectData;

            //only update realtime IF AND ONLY IF user is in the same project and not having any issues open 
            //OR having exactly the deleted issue opened
            if (prevProject.current && prevProject.current._id === projectData._id && !prevIssue.current) {
                setCurrentIssueList(projectData.issues);
                console.log("Updated issue list since a user changes it!")
            } else if (prevIssue.current && issueId === prevIssue.current._id) {
                setCurrentIssue(null);
                setCurrentIssueList(projectData.issues);
                console.log("Updated issue list since a user changes it!")
            }
        })

        //listens for any new assignment to an issue from an admin
        socket.on("assignUserIssueRealtime", proj => {
            //only update if user has the same project opened
            if (prevProject.current && prevProject.current._id === proj._id && !prevIssue.current) {
                setCurrentIssueList(proj.issues);
                console.log("An admin added you to the issue!");
            }
        });

        //listens for removal from the project by an admin
        socket.on("removeUserIssueRealtime", data => {
            const readableData = JSON.parse(JSON.stringify(data));
            const issueId = readableData.issueId;
            const projectData = readableData.projectData;
            //if user has the same project opened 
            if (prevProject.current && prevProject.current._id === projectData._id && !prevIssue.current) {
                setCurrentIssueList(projectData.issues);
                console.log("An admin removed you from an issue!");
            }
            //if user has the same issue opened -> close that issue 
            else if (prevIssue.current && issueId === prevIssue.current._id) {
                setCurrentIssue(null);
                setCurrentIssueList(projectData.issues);
                console.log("An admin removed you from an issue!")
            }
        });

        //** adding n deleting comments will display it to all users in the issue */
        socket.on("modifyCommentRealtime", data => {
            const readableData = JSON.parse(JSON.stringify(data));
            const issueData = readableData.issueData;
            //only update realtime if  having exactly that issue opened  
            if (prevIssue.current && issueData._id === prevIssue.current._id) {
                setCurrentIssue(issueData);
                console.log("Updated issue comments since a user changes it!")
            }
        })

        //updating notifications
        socket.on("updateNoti", user => {
            setNoti(user.notifications);
        })
    }, [socket]);

    /**********GET USER INFORMATION ON START UP**********/
    useEffect(() => {
        async function getDashboard() {
            setIsLoadingLogOut(true);
            setIsLoadingIssue(true);
            setIsLoadingProject(true);
            await checkExpiry();
            if (localStorage.getItem("accessToken")) {
                console.log("Making requests ...")
                axios({
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("accessToken"),
                    },
                    //get token from user data's accessToken
                    url: "/api/dashboard",
                    method: "GET",
                    withCredentials: true
                }).then((res) => {
                    setIsLoadingLogOut(false);
                    setIsLoadingProject(false);
                    setIsLoadingIssue(false);
                    //if server response good, set authenticated to True
                    if (res.status === 200) {
                        setIsAuthenticated(true);
                        setCurrentUser(res.data);
                        setNoti(res.data.notifications);
                        console.log("Successfully retrieved data!", res.data);
                        //handshake with server ONLY when authenticated
                        socket.emit('joinUser', res.data._id);

                    }
                }).catch((err) => {
                    //else get the error and direct to login
                    history.push("/loginOrRegister")
                })
            } else {
                console.log("Token not found");
                history.push("/loginOrRegister");
            }
        }
        getDashboard();
    }, [])

    /***************FOR LOG OUT************** */
    async function handleLogOut() {
        await checkExpiry();
        setIsLoadingLogOut(true);
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "POST",
                url: "/api/logout",
                withCredentials: true,
            }).then(res => {
                setIsLoadingLogOut(false);
                if (res.status === 200) {
                    //if server response ok, clear the current user and direct to login
                    setCurrentUser(null);
                    localStorage.clear("accessToken");
                    console.log("Logged out!");
                    history.push("/loginOrRegister")
                }
            })
        }
    }

    //////////////////////////////////HANDLE FUNCTIONS/////////////////////////////////////////

    //HANDLE THE CLICK ON ANY PROJECT, WILL REASSIGN THE CURRENT PROJECT AND ISSUE LIST STATES//
    async function handleClickOnProject(id) {
        await checkExpiry();
        setIsLoadingProject(true);
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "GET",
                url: "/api/getProject/" + id,
                withCredentials: true,
            }).then(res => {
                setCurrentIssue(null);
                setIsLoadingProject(false);
                if (res.status === 200) {
                    //set current project to the one matches the id that we clicked on
                    setCurrentProject(res.data);
                    if (width > 580) {
                        setCurrentIssueList(res.data.issues);
                        //applying the current sorting method for consistency
                        handleSort(sortOption, res.data.issues);
                    }
                }
            }).catch(error => {
                setIsLoadingProject(false);
                setDisplayError(error.response.data);
            })
        }
    }

    async function handleClickOnIssue(id) {
        await checkExpiry();
        setIsLoadingIssue(true);
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "GET",
                url: "/api/getIssue/" + id,
                withCredentials: true,
            }).then(res => {
                setIsLoadingIssue(false);
                if (res.status === 200) {
                    //set current issue to the one we clicked on
                    setCurrentIssue(res.data);
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                setDisplayError(error.response.data);
            })
        }
    }

    //FOR SUBMITTING A NEW PROJECT
    async function handleSubmitNewProject(evt) {
        evt.preventDefault();
        setIsLoadingProject(true);
        setIsClickedCreateProject(false);
        await checkExpiry();
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "POST",
                data: {
                    projectName: newProjectName
                },
                url: "/api/createProject",
                withCredentials: true,
            }).then(res => {
                setIsLoadingProject(false);
                if (res.status === 200) {
                    setCurrentUser(res.data);
                    console.log("Created new post!");
                }
            }).catch(error => {
                setIsLoadingProject(false);
                setDisplayError(error.response.data);
            })
        }
    }

    //AFTER EDITING A PROJECT NAME
    async function handleEditProject(id, newName) {
        setIsLoadingProject(true);
        await checkExpiry();
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "PUT",
                data: {
                    projectId: id,
                    projectName: newName
                },
                url: "/api/modifyProject",
                withCredentials: true,
            }).then(res => {
                setIsLoadingProject(false);
                if (res.status === 200) {
                    setCurrentUser(res.data);
                    console.log("Edited project name!");
                    socket.emit('editProject', { project: currentProject, userId: currentUser._id });
                }
            }).catch(error => {
                setIsLoadingProject(false);
                setDisplayError(error.response.data);
            })
        }
    }

    //DELETING A PROJECT
    async function handleDeleteProject(id) {
        setIsLoadingProject(true);
        await checkExpiry();
        const deleteOption = window.confirm("Confirm Deletion?");
        if (deleteOption) {
            if (localStorage.getItem("accessToken")) {
                axios({
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("accessToken"),
                    },
                    method: "DELETE",
                    data: {
                        projectId: id
                    },
                    url: "/api/deleteProject",
                    withCredentials: true,
                }).then(res => {
                    setIsLoadingProject(false);
                    if (res.status === 200) {
                        setCurrentUser(res.data);
                        setCurrentProject(null);
                        socket.emit('deleteProject', { project: currentProject, userId: currentUser._id });
                        console.log("Deleted project!");
                    }
                }).catch(error => {
                    setIsLoadingProject(false);
                    setDisplayError(error.response.data);
                })
            } else {
                setIsLoadingProject(false);
            }
        }

    }

    /**SUBMITTING A NEW ISSUE */
    async function handleSubmitNewIssue(evt) {
        setIsLoadingIssue(true);
        evt.preventDefault();
        await checkExpiry();

        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "POST",
                data: {
                    issueTitle: newIssueTitle,
                    issueDescription: newIssueDescription,
                    issuePriority: newIssuePriority,
                    issueSolved: newIssueSolved,
                    issueDeadline: newIssueDeadline,
                    projectId: currentProject._id
                },
                url: "/api/createIssue",
                withCredentials: true,
            }).then(res => {
                setIsLoadingIssue(false);
                if (res.status === 200) {
                    setCurrentIssueList(res.data.issues);
                    //re-sort to keep the issues in order like before modifying
                    handleSort(sortOption, res.data.issues);
                    document.getElementById("formIssueToggler").click();
                    console.log("New issue submitted!");
                    socket.emit('createIssue', { project: res.data, userId: currentUser._id });
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                setDisplayError(error.response.data);
            })
        }
    };


    //EDITING A CURRENT ISSUE
    async function handleEditIssue(title, des, priority, solved, deadline, id) {
        setIsLoadingIssue(true);
        await checkExpiry();
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "PUT",
                data: {
                    issueTitle: title,
                    issueDescription: des,
                    issuePriority: priority,
                    issueSolved: solved,
                    issueId: id,
                    issueDeadline: deadline,
                    projectId: currentProject._id
                },
                url: "/api/modifyIssue",
                withCredentials: true,
            }).then(res => {
                setIsLoadingIssue(false);
                if (res.status === 200) {
                    setCurrentIssue(res.data)
                    console.log("Edited issue details!");
                    socket.emit('modifyIssue', { project: currentProject, userId: currentUser._id, issue: res.data });
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                setDisplayError(error.response.data);
            })
        }
    }

    //DELETING A SELECTED ISSUE
    async function handleDeleteIssue(id) {
        setIsLoadingIssue(true);
        await checkExpiry();
        const deleteOption = window.confirm("Confirm Deletion?");
        if (deleteOption) {
            if (localStorage.getItem("accessToken")) {
                axios({
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("accessToken"),
                    },
                    method: "DELETE",
                    data: {
                        issueId: id,
                        projectId: currentProject._id
                    },
                    url: "/api/deleteIssue",
                    withCredentials: true,
                }).then(res => {
                    setIsLoadingIssue(false);
                    if (res.status === 200) {
                        setCurrentProject(res.data);
                        setCurrentIssueList(res.data.issues);
                        setCurrentIssue(null);
                        console.log("Deleted issue successfully!");
                        socket.emit('removeIssue', { project: res.data, userId: currentUser._id, issueId: id });
                    }
                }).catch(error => {
                    setIsLoadingIssue(false);
                    setDisplayError(error.response.data);
                })
            }
        } else {
            setIsLoadingIssue(false);
        }
    }

    async function addUserToProject(id, name, addedEmail, addedRole) {
        setIsLoadingProject(true);
        await checkExpiry();
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "POST",
                data: {
                    addedEmail: addedEmail,
                    addedRole: addedRole,
                    projectId: id,
                    projectName: name,
                },
                url: "/api/addUserToProject",
                withCredentials: true,
            }).then(res => {
                setIsLoadingProject(false);
                if (res.status === 200) {
                    setCurrentProject(res.data);
                    //send the new project data (which includes the new user)
                    socket.emit('editProject', { project: res.data, userId: currentUser._id });
                    console.log(res.data);
                    console.log("Added new user!")
                }
            }).catch(error => {
                setIsLoadingProject(false);
                setDisplayError(error.response.data);
            })
        }
    }

    async function deleteUserFromProject(userId, projectId, projectName) {
        setIsLoadingProject(true);
        await checkExpiry();
        const deleteOption = window.confirm("Confirm Deletion?");
        if (deleteOption) {
            if (localStorage.getItem("accessToken")) {
                axios({
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("accessToken"),
                    },
                    method: "DELETE",
                    data: {
                        deletedId: userId,
                        projectId: projectId,
                        projectName: projectName
                    },
                    url: "/api/deleteUserFromProject",
                    withCredentials: true,
                }).then(res => {
                    setIsLoadingProject(false);
                    if (res.status === 200) {
                        setCurrentProject(res.data)
                        setCurrentIssue(null);
                        console.log(res.data);
                        //sending the old project (which still has the old user's name!)
                        socket.emit('editProject', { project: currentProject, userId: currentUser._id });
                        console.log("Deleted user from project!")
                    }
                }).catch(error => {
                    setIsLoadingProject(false);
                    setDisplayError(error.response.data);
                })
            }
        } else {
            setIsLoadingProject(false);
        }
    }


    async function assignUserToIssue(issueId, projectId, addedId, title) {
        setIsLoadingIssue(true)
        await checkExpiry();
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "POST",
                data: {
                    issueId: issueId,
                    projectId: projectId,
                    addedUserId: addedId,
                    issueTitle: title
                },
                url: "/api/assignUserToIssue",
                withCredentials: true,
            }).then(res => {
                setIsLoadingIssue(false);
                if (res.status === 200) {
                    setCurrentIssue(res.data);
                    console.log("Assigned user to issue!");
                    socket.emit('assignUserIssue', { project: currentProject, addedId: addedId });
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                setDisplayError(error.response.data);
            })
        }
    }

    async function removeUserFromIssue(issueId, projectId, removedId, title) {
        setIsLoadingIssue(true)
        await checkExpiry();
        const deleteOption = window.confirm("Confirm Deletion?");
        if (deleteOption) {
            if (localStorage.getItem("accessToken")) {
                axios({
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("accessToken"),
                    },
                    method: "DELETE",
                    data: {
                        issueId: issueId,
                        projectId: projectId,
                        removedUserId: removedId,
                        issueTitle: title
                    },
                    url: "/api/removeUserFromIssue",
                    withCredentials: true,
                }).then(res => {
                    setIsLoadingIssue(false);
                    if (res.status === 200) {
                        setCurrentIssue(res.data);
                        console.log("Removed user from issue!");
                        socket.emit('removeUserIssue', { project: currentProject, removedId: removedId, issueId: issueId });
                    }
                }).catch(error => {
                    setIsLoadingIssue(false);
                    setDisplayError(error.response.data);
                })
            }
        }
    }

    async function handleAddComment(issueId, comment, title) {
        setIsLoadingIssue(true)
        await checkExpiry();
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "POST",
                data: {
                    issueId: issueId,
                    commentDetail: comment,
                    issueTitle: title
                },
                url: "/api/addCommentToIssue",
                withCredentials: true,
            }).then(res => {
                setIsLoadingIssue(false);
                if (res.status === 200) {
                    setCurrentIssue(res.data);
                    console.log("Added comment!");
                    socket.emit('modifyComment', { project: currentProject, userId: currentUser._id, issue: res.data });
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                setDisplayError(error.response.data);
            })
        }
    }

    async function handleDeleteComment(issueId, projectId, commentId) {
        setIsLoadingIssue(true)
        await checkExpiry();
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "DELETE",
                data: {
                    issueId: issueId,
                    projectId: projectId,
                    commentId: commentId
                },
                url: "/api/deleteCommentFromIssue",
                withCredentials: true,
            }).then(res => {
                setIsLoadingIssue(false);
                if (res.status === 200) {
                    setCurrentIssue(res.data);
                    console.log("Deleted comment!");
                    socket.emit('modifyComment', { project: currentProject, userId: currentUser._id, issue: res.data });
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                setDisplayError(error.response.data);
            })
        }
    }

    async function handleDeleteNoti(e, noti) {
        await checkExpiry();
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "DELETE",
                data: {
                    notiId: noti._id
                },
                url: "/api/deleteNotifications",
                withCredentials: true,
            }).then(res => {
                if (res.status === 200) {
                    setNoti(res.data.notifications);
                    console.log("Deleted notification(s)!");
                }
            }).catch(error => {
                setDisplayError(error.response.data);
            })
        }
    }

    async function handleReadNoti() {
        await checkExpiry();
        if (localStorage.getItem("accessToken")) {
            axios({
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("accessToken"),
                },
                method: "PUT",
                data: {

                },
                url: "/api/setReadNotifications",
                withCredentials: true,
            }).then(res => {
                if (res.status === 200) {
                    setNoti(res.data.notifications);
                    console.log(res.data.notifications);
                }
            }).catch(error => {
                setDisplayError(error.response.data);
            })
        }
    }

    function checkAdminOrAssigned(currentProject, currentIssue) {
        const check = currentProject.admins.filter(admin => admin._id === currentUser._id);
        if (check.length === 1) {
            return true
        } else {
            const check2 = currentIssue.users.filter(user => user === currentUser._id);
            if (check2.length === 1) {
                return true

            } else {
                return false
            }
        }
    }
    return (
        <div >
            {isAuthenticated && currentUser ?
                <>
                    {/* Allow pop up when there is error */}
                    {displayError ?
                        <PopUp
                            type="error"
                            content={displayError}
                            handleClick={() => setDisplayError(null)}

                        /> : null}

                    {/* Navigation bar */}
                    <NavBar
                        name={currentUser ? currentUser.name : ""}
                        handleLogOut={handleLogOut}
                        loading={isLoadingLogOut}
                        noti={noti}
                        width={width}
                        handleDeleteNoti={handleDeleteNoti}
                        handleReadNoti={handleReadNoti}
                    />

                    <div className="row dashboard" style={displayError ? { opacity: 0.7, pointerEvents: "none" } : null}>
                        <div className="col-12 col-sm-5 col-md-4 display-column projects">
                            <div className="heading-wrapper">
                                <h4 >Projects
                                    {isLoadingProject ? <div className="loader"></div> : null}
                                </h4>
                                {/* Pull out the create project form if the add button is clicked */}
                                {isClickedCreateProject ?
                                    <form className=" form-create" onSubmit={handleSubmitNewProject}>
                                        <input type="text" placeholder="New Project Name"
                                            className="edit-input"
                                            style={{ margin: 0 }}
                                            id="projectName"
                                            onChange={evt => setNewProjectName(evt.target.value)}>
                                        </input>
                                        <i className="fas fa-times"
                                            onClick={() => setIsClickedCreateProject(prev => !prev)}>
                                        </i>
                                    </form>

                                    :
                                    //if not, show the add button
                                    <i className="far fa-plus-square"
                                        onClick={() => setIsClickedCreateProject(prev => !prev)}>
                                    </i>}
                            </div>

                            {/* Map out all projects that current user has */}
                            {currentUser.projects.map(project =>
                                <DisplayProject
                                    key={project._id}
                                    width={width}
                                    project={project}
                                    admins={currentProject ? currentProject.admins : null}
                                    users={currentProject ? currentProject.users : null}
                                    currentUser={currentUser}
                                    clicked={currentProject ? project._id === currentProject._id ? true : false : null}
                                    addUser={addUserToProject}
                                    deleteUser={deleteUserFromProject}
                                    handleClick={handleClickOnProject}
                                    handleDelete={handleDeleteProject}
                                    handleEdit={handleEditProject}
                                    handleSmallScreenClickOnProject={() => {
                                        setDisplayIssesOnMobile(true);
                                        setCurrentIssueList(currentProject.issues);
                                    }} />
                            )}
                        </div>
                        {/* show the issues column if mobile width & user having a project open OR desktop width */}
                        {width < 580 && currentProject && displayIssuesOnMobile || width > 580 ?
                            <div className="col-12 col-sm-7 col-md-8 display-column issues">
                                <div className="heading-wrapper">
                                    <h4>Issues:
                                        {currentIssue ?

                                            <i className="fas fa-arrow-left" onClick={() => {
                                                setCurrentIssue(null);
                                                handleClickOnProject(currentProject._id);
                                            }}>

                                            </i>
                                            : null}
                                        {isLoadingIssue ? <div className="loader"></div> : null}
                                    </h4>
                                    {/* if there arent any issue selected, taskbar will show options to sort the issue list */}
                                    {currentProject ? currentIssue ? null :
                                        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", height: "1rem" }}>
                                            <div className="select-wrapper" style={{ width: "10rem" }}>
                                                <select id="issueSort" onChange={evt => {
                                                    const newSortOption = evt.target.value;
                                                    setSortOption(newSortOption);
                                                    handleSort(newSortOption, currentIssueList)

                                                }}
                                                    defaultValue={""}
                                                    style={{ margin: "0", padding: "0 0.5rem" }}>
                                                    <option value="" disabled>Sort by</option>
                                                    <option value="date-as" defaultValue>Oldest (default)</option>
                                                    <option value="date-des">Newest </option>
                                                    <option value="pri-as">Priority - lowest</option>
                                                    <option value="pri-des">Priority - highest </option>
                                                    {/* <option value="end-des">Ending soonest</option> */}
                                                </select>
                                                <span className="select-arrow ">
                                                    <i className="fas fa-long-arrow-alt-down"></i>
                                                </span>

                                            </div>
                                            {/* the show done / hide done option when is in desktop width */}
                                            {width < 580 ? null :
                                                showDone ?
                                                    <span
                                                        className="state-indicator"
                                                        style={{
                                                            fontSize: "0.7rem", background: "transparent", color: "#77a186", margin: 0,
                                                            border: "solid #77a186 0.01rem",
                                                            transform: "translateY(-0.2rem)"
                                                        }}
                                                        onClick={() => setShowDone(prev => !prev)}>
                                                        <p style={{
                                                            color: "#77a186", transform: "translateY(-0.1rem)",
                                                            textDecoration: "line-through",
                                                            textDecorationThickness: "0.08rem"
                                                        }}>
                                                            Hide Done
                                                        </p>
                                                    </span>
                                                    :
                                                    <span
                                                        className="state-indicator"
                                                        style={{
                                                            fontSize: "0.7rem", background: "#77a186", color: "#F8F9FD", margin: 0,
                                                            transform: "translateY(-0.2rem)"
                                                        }}
                                                        onClick={() => setShowDone(prev => !prev)}>
                                                        <p style={{ transform: "translateY(-0.05rem)" }}>Show Done</p>
                                                    </span>}

                                            <div className="icon-wrapper">
                                                <i className="far fa-plus-square"
                                                    id="formIssueToggler"
                                                    data-toggle="collapse"
                                                    data-target="#formIssue"
                                                    aria-expanded="false"
                                                    aria-controls="formIssue">
                                                </i>
                                            </div>

                                        </div> : null}
                                </div>
                                {/* when user has an active issue list & on mobile width */}
                                {currentProject && width < 580 && !currentIssue ?
                                    <div className="heading-wrapper">
                                        {/* go back arrow */}
                                        <i className="fas fa-arrow-left" onClick={() => {
                                            setDisplayIssesOnMobile(false);
                                        }}></i>

                                        {/* show done / hide done options on mobile */}
                                        {showDone ?
                                            <span
                                                className="state-indicator"
                                                style={{
                                                    fontSize: "0.7rem", background: "transparent", color: "#77a186", margin: 0,
                                                    border: "solid #77a186 0.01rem",

                                                }}
                                                onClick={() => setShowDone(prev => !prev)}>
                                                <p style={{
                                                    color: "#77a186",
                                                    textDecoration: "line-through",
                                                    textDecorationThickness: "0.08rem"
                                                }}>
                                                    Hide Done
                                                </p>
                                            </span>
                                            :
                                            <span
                                                className="state-indicator"
                                                style={{
                                                    fontSize: "0.7rem", background: "#77a186", color: "#F8F9FD", margin: 0,

                                                }}
                                                onClick={() => setShowDone(prev => !prev)}>
                                                <p>Show Done</p>
                                            </span>}
                                    </div>


                                    : null}

                                {/* show the add issue form if the user doesnt have an active issue */}
                                {currentIssue ? null :
                                    <div className="form-issue-wrapper collapse " id="formIssue" >
                                        <div className="form-issue " >
                                            <input type="text" placeholder="Title" id="IssueTitle" required
                                                value={newIssueTitle}
                                                className="edit-input"
                                                onChange={evt => setNewIssueTitle(evt.target.value)}>
                                            </input>
                                            <textarea placeholder="Description" id="issueDescription" required
                                                className="edit-input"
                                                value={newIssueDescription}
                                                onChange={evt => setNewIssueDescription(evt.target.value)}>
                                            </textarea>
                                            <div className="select-wrapper">
                                                <select id="issuePriority"
                                                    defaultValue={""}
                                                    className="edit-input"
                                                    required
                                                    onChange={evt => setNewIssuePriority(evt.target.value)}>
                                                    <option value="" disabled>Priority</option>
                                                    <option value="High" >High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                                <span className="select-arrow ">
                                                    <i className="fas fa-long-arrow-alt-down"></i>
                                                </span>
                                            </div>
                                            <div className="select-wrapper">
                                                <select id="issueSolved"
                                                    defaultValue={""}
                                                    required
                                                    className="edit-input"
                                                    onChange={evt => setNewIssueSolved(evt.target.value)}>
                                                    <option value="" disabled>Issue state</option>
                                                    <option value="Unsolved" >Unsolved</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Done">Done</option>
                                                </select>
                                                <span className="select-arrow ">
                                                    <i className="fas fa-long-arrow-alt-down"></i>
                                                </span>
                                            </div>
                                            <p style={{ marginTop: "2rem", marginBottom: 0, color: "#B1BAC7" }}>Deadline</p>
                                            <div className="select-wrapper date-select">
                                                <input type="datetime-local"
                                                    className="edit-input"
                                                    onChange={evt => setNewIssueDeadline(evt.target.value)}>
                                                </input>
                                                <i className="far fa-calendar-alt"></i>
                                            </div>
                                            <button onClick={handleSubmitNewIssue}
                                                className="function-button button-medium"
                                                type="submit">
                                                Add
                                            </button>
                                        </div>
                                    </div>}

                                {/* If an issue is chosen */}
                                {currentIssue ?
                                    <DisplayIssue
                                        width={width}
                                        issue={currentIssue}
                                        currentUser={currentUser}
                                        currentProject={currentProject}
                                        clicked={true}
                                        assignUser={assignUserToIssue}
                                        removeUser={removeUserFromIssue}
                                        handleClick={handleClickOnIssue}
                                        handleDelete={handleDeleteIssue}
                                        handleEdit={handleEditIssue}
                                        handleAddComment={handleAddComment}
                                        handleDeleteComment={handleDeleteComment}
                                    /> :
                                    currentProject ? showDone ? currentIssueList.map(issue => {
                                        //if the current user is the admin of the project OR an assigneduser return all issues
                                        const check = checkAdminOrAssigned(currentProject, issue);
                                        if (check === true) {
                                            return (
                                                <DisplayIssue
                                                    key={issue._id}
                                                    issue={issue}
                                                    currentUser={currentUser}
                                                    currentProject={currentProject}
                                                    clicked={false}
                                                    handleClick={handleClickOnIssue}
                                                />)
                                        }
                                    })
                                        :
                                        //when hide done is selected, filter all done issues
                                        currentIssueList.filter(issue => issue.solved !== "Done").map(issue => {
                                            const check = checkAdminOrAssigned(currentProject, issue);
                                            if (check === true) {
                                                return (
                                                    <DisplayIssue
                                                        key={issue._id}
                                                        issue={issue}
                                                        currentUser={currentUser}
                                                        currentProject={currentProject}
                                                        clicked={false}
                                                        handleClick={handleClickOnIssue}
                                                    />)
                                            }
                                        }
                                        )
                                        :
                                        //if there isnt an active issue, tell user to select one
                                        <h5 style={{ fontSize: "1rem", padding: "0.5rem", color: "#B1BAC7" }}>
                                            Choose a project to view issues
                                        </h5>
                                }
                            </div> : null}
                    </div>
                </> : null
            }
        </div >
    )
}

export default Dashboard;