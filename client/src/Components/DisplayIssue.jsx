import React from 'react';

function DisplayIssue(props) {
    const { title, description, priority, solved, _id, date, users } = props.issue;
    const projectAdmins = props.currentProject.admins;
    const projectUsers = props.currentProject.users;
    const [isClickedEdit, setIsClickedEdit] = React.useState(false);
    const [modifiedIssueTitle, setModifiedIssueTitle] = React.useState(title);
    const [modifiedIssueDescription, setModifiedIssueDescription] = React.useState(description);
    const [modifiedIssuePriority, setModifiedIssuePriority] = React.useState(priority);
    const [modifiedIssueSolved, setModifiedIssueSolved] = React.useState(solved);
    const [showAssignUserForm, setShowAssignUserForm] = React.useState(false);
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
    //Getting the date in user's timezone
    const unixTime = Date.parse(date);
    const clientDate = new Date();
    clientDate.setTime(unixTime);
    function getMMDDYYYY(date) {
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var year = date.getFullYear();
        return month + '/' + day + '/' + year
    }

    //Handling submission of editing an issue
    function handleEditConfirm(evt) {
        evt.preventDefault();
        setIsClickedEdit(false);
        props.handleEdit(modifiedIssueTitle, modifiedIssueDescription, modifiedIssuePriority, modifiedIssueSolved, _id);
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
                                    backgroundColor: priority === "High" ? "#FB7693"
                                        : priority === "Medium" ? "#FFA9C4"
                                            : "#FDBD73"
                                }}>
                                <p>{priority}</p>
                            </span>
                            <span
                                style={{
                                    backgroundColor: solved === "Unsolved" ? "#FDBD73"
                                        : solved === "In Progress" ? "#BCE6FE"
                                            : "#78C233"
                                }}>
                                <p>{solved}</p>
                            </span>

                        </div>
                        <div className="display-content"
                            style={{
                                paddingLeft: "0.5rem"
                            }}>
                            <h5 onClick={handleClick}> {title}</h5>
                            <p onClick={handleClick}>{getMMDDYYYY(clientDate)}</p>
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
                                style={{ color: isClickedEdit ? "#78C233" : "" }}>
                            </i>
                            : null}
                    </div> : null}
            </div>
            {props.clicked ?
                <div className="display-content" id={customId}>
                    <div className="display-content" style={{ margin: "1rem 0 1rem 0" }}>
                        <span className="content-section">
                            <h6>Description</h6>
                            <figure className="border-design grey">
                            </figure>
                        </span>
                        <p> {description}</p>
                    </div>

                    <div className="display-content" style={{ margin: "0.5rem 0 0 0" }}>
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
                                                color: "#1B1C30", background: "#91DEFB", padding: "0.2rem 0.5rem",
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
                </div> : null}
        </div >

    )
}

export default DisplayIssue;