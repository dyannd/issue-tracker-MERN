import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Switch, useHistory, Redirect } from 'react-router-dom';
import NavBar from './NavBar';
import jwt_decode from 'jwt-decode';
import DisplayProject from './DisplayProject';
import DisplayIssue from './DisplayIssue';
import PopUp from './PopUp';
import './Dashboard.css';
function Dashboard(props) {

    const [currentUser, setCurrentUser] = React.useState("");
    //currentProject can help handle the render of its issues.
    const [currentProject, setCurrentProject] = React.useState(null);
    const [currentIssueList, setCurrentIssueList] = React.useState([]);
    const [currentIssue, setCurrentIssue] = React.useState(null);
    const [sortOption, setSortOption] = React.useState("date-as");
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isClickedCreateProject, setIsClickedCreateProject] = React.useState(false);
    const [newProjectName, setNewProjectName] = React.useState("");
    const [newIssueTitle, setNewIssueTitle] = React.useState("");
    const [newIssueDescription, setNewIssueDescription] = React.useState("");
    const [newIssuePriority, setNewIssuePriority] = React.useState("");
    const [newIssueSolved, setNewIssueSolved] = React.useState("");
    const [newIssueDeadline, setNewIssueDeadline] = React.useState("");
    const [isLoadingIssue, setIsLoadingIssue] = React.useState(false);
    const [isLoadingProject, setIsLoadingProject] = React.useState(false);
    const [isLoadingLogOut, setIsLoadingLogOut] = React.useState(false);
    const [showDone, setShowDone] = React.useState(true);
    const [displayError, setDisplayError] = React.useState(null);
    const history = useHistory();

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
            const dateA = issueA.deadline !== undefined ?Date.parse(issueA.deadline) : Date.parse(issueA.date) + 1000000000;
            const dateB = issueB.deadline !== undefined ?Date.parse(issueB.deadline) : Date.parse(issueB.date)  + 1000000000;
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
            }else if (sortValue === "end-des"){
                return sorted.sort(compareDeadSoonest);
            }
        }
        const newIssueArray = sortingIssue();
        setCurrentIssueList(newIssueArray);
    }

    /**********GET USER INFORMATION ON START UP**********/
    React.useEffect(() => {
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
                        console.log("Successfully retrieved data!", res.data);
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
                    setCurrentIssueList(res.data.issues);
                    //applying the current sorting method for consistency
                    handleSort(sortOption, res.data.issues);
                }
            }).catch(error => {
                setIsLoadingProject(false);
                console.log(error.response.data);
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
                    console.log(res.data)
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                console.log(error.response.data);
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
                console.log(error.response.data);
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
                }
            }).catch(error => {
                setIsLoadingProject(false);
                console.log(error.response.data);
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
                        console.log("Deleted project!");
                    }
                }).catch(error => {
                    setIsLoadingProject(false);
                    console.log(error.response.data);
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
                    setNewIssueTitle("");
                    setNewIssueDescription("");
                    setNewIssueSolved("");
                    setNewIssuePriority("");
                    document.getElementById("formIssueToggler").click();
                    console.log("New issue submitted!");
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                console.log(error.response.data);
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
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                console.log(error.response.data);
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
                        console.log("Deleted issue successfully!")
                    }
                }).catch(error => {
                    setIsLoadingIssue(false);
                    console.log(error.response.data);
                    setDisplayError(error.response.data);
                })
            }
        } else {
            setIsLoadingIssue(false);
        }
    }

    async function addUserToProject(id, addedEmail, addedRole) {
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
                },
                url: "/api/addUserToProject",
                withCredentials: true,
            }).then(res => {
                setIsLoadingProject(false);
                if (res.status === 200) {
                    setCurrentProject(res.data);
                    console.log("Added new user!")
                }
            }).catch(error => {
                setIsLoadingProject(false);
                setDisplayError(error.response.data);
            })
        }
    }

    async function deleteUserFromProject(userId, projectId) {
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
                    },
                    url: "/api/deleteUserFromProject",
                    withCredentials: true,
                }).then(res => {
                    setIsLoadingProject(false);
                    if (res.status === 200) {
                        setCurrentProject(res.data)
                        setCurrentIssue(null);
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


    async function assignUserToIssue(issueId, projectId, addedId) {
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
                    addedUserId: addedId
                },
                url: "/api/assignUserToIssue",
                withCredentials: true,
            }).then(res => {
                setIsLoadingIssue(false);
                if (res.status === 200) {
                    setCurrentIssue(res.data)
                    console.log(res.data)
                    console.log("Assigned user to project!")
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                console.log(error.response.data);
                setDisplayError(error.response.data);
            })
        }
    }

    async function removeUserFromIssue(issueId, projectId, removedId) {
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
                        removedUserId: removedId
                    },
                    url: "/api/removeUserFromIssue",
                    withCredentials: true,
                }).then(res => {
                    setIsLoadingIssue(false);
                    if (res.status === 200) {
                        setCurrentIssue(res.data)
                        console.log(res.data)
                        console.log("Removed user from issue!")
                    }
                }).catch(error => {
                    setIsLoadingIssue(false);
                    console.log(error.response.data);
                    setDisplayError(error.response.data);
                })
            }
        } else {
            setIsLoadingIssue(false);
        }
    }

    async function handleAddComment(issueId, comment){
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
                   commentDetail: comment
                },
                url: "/api/addCommentToIssue",
                withCredentials: true,
            }).then(res => {
                setIsLoadingIssue(false);
                if (res.status === 200) {
                    setCurrentIssue(res.data)
                    console.log("Added comment!")
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                console.log(error.response.data);
                setDisplayError(error.response.data);
            })
        }
    }

    async function handleDeleteComment(issueId, projectId, commentId){
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
                    setCurrentIssue(res.data)
                    console.log(res.data)
                    console.log("Deleted comment!")
                }
            }).catch(error => {
                setIsLoadingIssue(false);
                console.log(error.response.data);
                setDisplayError(error.response.data);
            })
        }
    }
    return (
        <div >
            {isAuthenticated && currentUser ?
                <>
                    {displayError ?
                        <PopUp
                            type="error"
                            content={displayError}
                            handleClick={() => setDisplayError(null)}
                        /> : null}


                    <NavBar
                        name={currentUser ? currentUser.name : ""}
                        handleLogOut={handleLogOut}
                        loading={isLoadingLogOut} />

                    <div className="row dashboard" style={displayError ? { opacity: 0.7, pointerEvents: "none" } : null}>
                        <div className="col-12 col-sm-5 col-md-4 display-column">
                            <div className="heading-wrapper">
                                <h4 >Projects
                                    {isLoadingProject ? <div className="loader"></div> : null}
                                </h4>
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
                                    : <i className="far fa-plus-square"
                                        onClick={() => setIsClickedCreateProject(prev => !prev)}>
                                    </i>}
                            </div>
                            {currentUser.projects.map(project =>
                                <DisplayProject
                                    key={project._id}
                                    project={project}
                                    admins={currentProject ? currentProject.admins : null}
                                    users={currentProject ? currentProject.users : null}
                                    currentUser={currentUser}
                                    clicked={currentProject ? project._id === currentProject._id ? true : false : null}
                                    addUser={addUserToProject}
                                    deleteUser={deleteUserFromProject}
                                    handleClick={handleClickOnProject}
                                    handleDelete={handleDeleteProject}
                                    handleEdit={handleEditProject} />
                            )}
                        </div>

                        <div className="col-12 col-sm-7 col-md-8 display-column">
                            <div className="heading-wrapper">
                                <h4>Issues:
                                    {currentIssue ?
                                        <button className="function-button"
                                            style={{ margin: "0", fontSize: "0.8rem", width: "4.5rem", marginLeft: "0.5rem" }}
                                            onClick={() => {
                                                setCurrentIssue(null);
                                                handleClickOnProject(currentProject._id);
                                            }}>
                                            All issues
                                        </button> : null}
                                    {isLoadingIssue ? <div className="loader"></div> : null}
                                </h4>

                                {currentProject ? currentIssue ? null :
                                    <div style={{ display: "flex", alignItems: "center" }}>

                                        <div className="select-wrapper">
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
                                        <button className="function-button"
                                            style={{ fontSize: "0.7rem", margin: "0 0.3rem", width: "5rem" }}
                                            onClick={() => setShowDone(prev => !prev)}>
                                            {!showDone ? "Show done" : "Hide done"}
                                        </button>
                                        <i className="far fa-plus-square"
                                            id="formIssueToggler"
                                            data-toggle="collapse"
                                            data-target="#formIssue"
                                            aria-expanded="false"
                                            aria-controls="formIssue">
                                        </i>

                                    </div> : null}
                            </div>

                            {currentIssue ? null :
                                <div className="form-issue-wrapper collapse " id="formIssue" >
                                    <form className="form-issue " onSubmit={handleSubmitNewIssue} >
                                        <input type="text" placeholder="Title" id="IssueTitle" required
                                            value={newIssueTitle}
                                            onChange={evt => setNewIssueTitle(evt.target.value)}>
                                        </input>
                                        <textarea placeholder="Description" id="issueDescription" required
                                            value={newIssueDescription}
                                            onChange={evt => setNewIssueDescription(evt.target.value)}>
                                        </textarea>
                                        <div className="select-wrapper">
                                            <select id="issuePriority"
                                                defaultValue={""}
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
                                        <div className="select-wrapper date-select">
                                            <input type="datetime-local"
                                                onChange={evt => setNewIssueDeadline(evt.target.value)}>
                                            </input>
                                            <i className="far fa-calendar-alt"></i>
                                        </div>
                                        <button className="function-button button-submit" type="submit">Add</button>
                                    </form>
                                </div>}
                            {currentIssue ?
                                <DisplayIssue
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
                                currentProject ? showDone ? currentIssueList.map(issue =>
                                    <>
                                        <DisplayIssue
                                            key={issue._id}
                                            issue={issue}
                                            currentUser={currentUser}
                                            currentProject={currentProject}
                                            clicked={false}
                                            handleClick={handleClickOnIssue}
                                        />
                                    </>)
                                    :
                                    currentIssueList.filter(issue => issue.solved !== "Done").map(issue =>
                                        <>
                                            <DisplayIssue
                                                key={issue._id}
                                                issue={issue}
                                                currentUser={currentUser}
                                                currentProject={currentProject}
                                                clicked={false}
                                                handleClick={handleClickOnIssue}
                                            />
                                        </>)
                                    :
                                    <h5 style={{ fontSize: "1rem", padding: "0.5rem", color: "#B1BAC7" }}>
                                        Choose a project to view issues
                                    </h5>
                            }
                        </div>
                    </div>
                </> : null}
        </div >
    )
}

export default Dashboard;