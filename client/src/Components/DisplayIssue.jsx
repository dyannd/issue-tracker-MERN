import React from 'react';

function DisplayIssue(props) {
    const { title, description, priority, solved, deadline, _id, date, users, comments } = props.issue;
    const projectAdmins = props.currentProject.admins;
    const projectUsers = props.currentProject.users;
    const [isClickedEdit, setIsClickedEdit] = React.useState(false);
    const [modifiedIssueTitle, setModifiedIssueTitle] = React.useState(title);
    const [modifiedIssueDescription, setModifiedIssueDescription] = React.useState(description);
    const [modifiedIssuePriority, setModifiedIssuePriority] = React.useState(priority);
    const [modifiedIssueSolved, setModifiedIssueSolved] = React.useState(solved);
    const [modifiedIssueDeadline, setModifiedIssueDeadline] = React.useState(deadline);
    const [showAssignUserForm, setShowAssignUserForm] = React.useState(false);
    const [addedComment, setAddedComment] = React.useState(null);
    const [showAddComments, setShowAddComments]=React.useState(false);
    const [assignedUser, setAssignedUser] = React.useState(null);
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isAssignedUser, setIsAssignedUser] = React.useState(false);

    React.useState(() => {
        if (projectAdmins) {
            const check = projectAdmins.filter(admin => admin._id === props.currentUser._id)
            if (check.length === 0) {
                setIsAdmin(false);
                const check2 = users.filter(assignUser => assignUser._id === props.currentUser._id);
                if (check2.length === 0) {
                    setIsAssignedUser(false);
                } else {
                    setIsAssignedUser(true);
                }
            } else {
                setIsAdmin(true);
                setIsAssignedUser(true);
            }
        }
    }, [])

    //function to convert string date to mmddyyyy
    function getMMDDYYYY(dateString) {
        const unixTime = Date.parse(dateString);
        const dateObject = new Date();
        dateObject.setTime(unixTime);

        const month = dateObject.getMonth() + 1;
        const day = dateObject.getDate();
        const year = dateObject.getFullYear();
        const hour = dateObject.getHours();
        const min = dateObject.getMinutes();
        return month + '/' + day + '/' + year + " at " + (hour < 10 ? "0" + hour : hour) + ":" + (min < 10 ? "0" + min : min)
    }

    function checkDeadline() {
        if (Date.parse(deadline) > Date.now()) {
            const difference = Date.parse(deadline) - Date.now()
            if (difference > 86400000) {
                return (Math.floor(difference / 86400000) + " days(s) left")
            } else if (difference > 3600000) {
                return (Math.floor(difference / 3600000) + " hour(s) left")
            } else if (difference > 60000) {
                return (Math.floor(difference / 60000) + " minute(s) left")
            } else {
                return (difference + " second(s) left")
            }
        } else {
            return "Deadline passed!"
        }
    }

    checkDeadline()
    //Handling submission of editing an issue
    function handleEditConfirm(evt) {
        evt.preventDefault();
        setIsClickedEdit(false);
        props.handleEdit(modifiedIssueTitle, modifiedIssueDescription, modifiedIssuePriority, modifiedIssueSolved, modifiedIssueDeadline, _id);
    }

    function handleAssignUserToIssue(evt) {
        evt.preventDefault();
        props.assignUser(_id, props.currentProject._id, assignedUser)
    }

    function handleRemoveUser(id, evt) {
        evt.preventDefault();
        props.removeUser(_id, props.currentProject._id, id.split("assigned")[1])
    }

    function handleClick() {
        props.handleClick(_id);
    }

    function handleAddComment() {
        props.handleAddComment(_id, addedComment);
        setAddedComment("");
    }

    function handleDeleteComment(commentId, evt) {
        props.handleDeleteComment(_id, props.currentProject._id, commentId.split("comment")[1])
    }
    //create custom Id bc bootstrap doesnt support id starting with numbers
    const customId = "issueDes" + _id;

    return (
        <div className="display-content-wrapper" >
            <div className="content-section">
                {isClickedEdit ?
                    <form className="display-content form-edit">
                        {isAdmin ?
                            <>
                                <input className="edit-input"
                                    type="text" placeholder="Title"
                                    defaultValue={title}
                                    onChange={evt => setModifiedIssueTitle(evt.target.value)}
                                    required>
                                </input>
                                <textarea
                                    className="edit-input"
                                    defaultValue={description}
                                    placeholder="Description"
                                    onChange={evt => setModifiedIssueDescription(evt.target.value)}
                                    required>
                                </textarea>
                                <div className="select-wrapper">
                                    <select
                                        onChange={evt => setModifiedIssuePriority(evt.target.value)}
                                        className="edit-input select"
                                        defaultValue={priority}>
                                        <option value="">Priority</option>
                                        <option value="High" >High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                    <span className="select-arrow ">
                                        <i className="fas fa-long-arrow-alt-down"></i>
                                    </span>
                                </div>
                                <div className="select-wrapper date-select">
                                    <input type="datetime-local" className="edit-input"
                                        style={{ width: "100%", paddingRight: "0" }}
                                        onChange={evt => setModifiedIssueDeadline(evt.target.value)}
                                        defaultValue={deadline}>
                                    </input>
                                    <i className="far fa-calendar-alt" style={{ background: "#12111a" }}></i>
                                </div>
                            </>
                            : null}
                        {isAssignedUser ?
                            <>
                                <div className="select-wrapper">
                                    <select
                                        onChange={evt => setModifiedIssueSolved(evt.target.value)}
                                        className="edit-input select"
                                        defaultValue={solved}>
                                        <option value="" disabled>Issue state</option>
                                        <option value="Unsolved" >Unsolved</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                    <span className="select-arrow ">
                                        <i className="fas fa-long-arrow-alt-down"></i>
                                    </span>
                                </div>

                                <button className="function-button button-submit"
                                    type="submit"
                                    onClick={handleEditConfirm}>
                                    Confirm
                                </button>
                            </>
                            : null}
                    </form>
                    :
                    <>
                        <div className="display-indicator">
                            <span
                                style={{
                                    backgroundColor: priority === "High" ? "#BF4B54"
                                        : priority === "Medium" ? "#b35e46"
                                            : "#b39370"
                                }}>
                                <p>{priority}</p>
                            </span>
                            <span
                                style={{
                                    backgroundColor: solved === "Unsolved" ? "#b3844f"
                                        : solved === "In Progress" ? "#17A0BF"
                                            : "#77a186"
                                }}>
                                <p>{solved}</p>
                            </span>
                        </div>


                        <div className="display-content"
                            style={{ paddingLeft: "0.5rem" }}>
                            <h5 onClick={handleClick}> {title}</h5>
                            <div className="content-section" style={{ margin: 0 }}>
                                <p onClick={handleClick} >
                                    Created:{" "}
                                    {getMMDDYYYY(date)}
                                </p>
                                {deadline ?
                                    <p onClick={handleClick}>
                                        <i className="fas fa-bomb"
                                            style={{ color: "#BF4B54" }}>
                                        </i>
                                        {checkDeadline()}
                                    </p>
                                    : null}
                            </div>
                        </div>
                    </>}


                {props.clicked ?
                    <div className="icon-wrapper">
                        {isAdmin ?
                            <i className="far fa-trash-alt" onClick={() => props.handleDelete(_id)} ></i>
                            : null}
                        {isAssignedUser ?
                            <i className="far fa-edit"
                                onClick={() => {
                                    setIsClickedEdit(prev => !prev)
                                }}
                                style={{ color: isClickedEdit ? "#77a186" : "" }}>
                            </i>
                            : null}
                    </div> : null}
            </div>
            {props.clicked ?
                <div className="display-content" id={customId}>

                    <div className="display-content">
                        <span className="content-section">
                            <h6>Description</h6>
                            <figure className="border-design grey">
                            </figure>
                        </span>
                        <p> {description}</p>
                    </div>

                    <div className="display-content">
                        <div className="content-section">
                            <h6>Assigned</h6>
                            {isAdmin ?
                                <div className="icon-wrapper">
                                    {!showAssignUserForm ?
                                        <i className="fas fa-user-plus small-icon"
                                            onClick={() => setShowAssignUserForm(prev => !prev)}>
                                        </i> :
                                        <i className="fas fa-user-times small-icon"
                                            onClick={() => setShowAssignUserForm(prev => !prev)}>
                                        </i>
                                    }
                                </div>
                                : null}
                            <figure className="border-design grey">
                            </figure>
                        </div>

                        {users.length === 0 ? <p>None</p> :
                            <div className="content-section">
                                {users.map(user =>
                                    <span style={{ display: "flex", margin: "0 0.5rem" }}>
                                        <p>
                                            <span style={{
                                                color: "#12111a", background: "#91DEFB", padding: "0.2rem 0.5rem",
                                                borderRadius: "10px"
                                            }}>
                                                {props.currentUser._id === user._id ? "You" : user.name}
                                            </span>
                                        </p>
                                        {isAdmin ?
                                            <div className="icon-wrapper">
                                                <i className="fas fa-user-minus small-icon" id={"assigned" + user._id}
                                                    onClick={e => handleRemoveUser("assigned" + user._id, e)}>
                                                </i>
                                            </div> : null}
                                    </span>)}
                            </div>
                        }
                        {showAssignUserForm ?
                            <form className="form-create"
                                onSubmit={handleAssignUserToIssue}
                                style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", width: "100%" }}>
                                <div className="select-wrapper">
                                    <select
                                        onChange={evt => setAssignedUser(evt.target.value)}
                                        className="select edit-input"
                                        required
                                        defaultValue={""}
                                        style={{ margin: 0, width: "7rem" }}>

                                        <option disabled value="">Available users</option>
                                        {projectAdmins ? projectAdmins.map(admin =>
                                            <option value={admin._id} key={admin._id}>
                                                {admin.name}
                                            </option>) : null}
                                        {projectUsers ? projectUsers.map(user =>
                                            <option value={user._id} key={user._id}>
                                                {user.name}
                                            </option>) : null}
                                    </select>
                                    <button type="submit"
                                        className="function-button"
                                        style={{
                                            margin: "0", width: "3.5rem", fontSize: "0.8rem",
                                            fontWeight: "normal", padding: "0.1rem 0.5rem"
                                        }}>
                                        Assign
                                    </button>
                                </div>

                            </form>

                            : null}
                    </div>

                    <div className="display-content">
                        <span className="content-section">
                            <h6>Comments</h6>
                            <div className="icon-wrapper">
                                <i className="fas fa-plus-circle small-icon" onClick={()=>setShowAddComments(prev => !prev)}></i>
                            </div>
                            <figure className="border-design grey">
                            </figure>
                        </span>
                        {showAddComments?
                        <form className="content-section" onSubmit={(e) => { e.preventDefault(); handleAddComment() }}>
                            <textarea
                                className="edit-input"
                                placeholder="Add a comment"
                                onChange={evt => setAddedComment(evt.target.value)}
                                required>
                            </textarea>
                            <button className="function-button"
                                type="submit"
                                style={{ width: "4.5rem", fontSize: "0.8rem", height: "2rem", margin: "0.5rem" }}>
                                Add
                            </button>
                        </form>
                        :null}
                        {comments ? comments.map(comment =>
                            //Getting the date object of date created
                            <div className="content-section">
                                <div className="icon-wrapper">
                                    <i className="far fa-trash-alt small-icon"
                                        id={"comment" + comment._id}
                                        onClick={e => handleDeleteComment("comment" + comment._id, e)} >

                                    </i>
                                </div>
                                <p style={{ background: "#474559", borderRadius: "15px", padding: "0.1rem 0.5rem" }}>
                                    {comment.details}
                                </p>
                                <p style={{ margin: "auto 0 auto 0.5rem" }}>
                                    {comment.commenter.id === props.currentUser._id ?
                                        <strong>You</strong> :
                                        <strong> comment.commenter.name</strong>}
                                    {" on " + getMMDDYYYY(comment.date)}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div> : null}
        </div >

    )
}

export default DisplayIssue;