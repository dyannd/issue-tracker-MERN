import React from 'react';

function DisplayProject(props) {
    const { name, date, _id } = props.project;
    const [newName, setNewName] = React.useState("");
    const [isClickedEdit, setIsClickedEdit] = React.useState(false);
    const [showAddUserForm, setShowAddUserForm] = React.useState(false);
    const [addedEmail, setAddedEmail] = React.useState("");
    const [addedRole, setAddedRole] = React.useState("");
    const { admins, users, currentUser } = props;


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
        return month + '/' + day + '/' + year + " at " + hour + ":" + (min < 10 ? "0" + min : min)
    }
    //for handling the edited name of the project
    function handleEditConfirm(evt) {
        evt.preventDefault();
        props.handleEdit(_id, newName);
        setIsClickedEdit(false);
    }

    //Passing the project id to the dashboard function 
    function handleClick() {
        props.handleClick(_id)
    }

    function handleAddUserToProject(evt) {
        evt.preventDefault();
        setAddedEmail("");
        props.addUser(_id, addedEmail, addedRole)
    }

    function handleDeleteUser(id, evt) {
        evt.preventDefault();
        props.deleteUser(id.split("added")[1], _id)
    }
    //create custom Id bc bootstrap doesnt support id starting with numbers
    const customId = "projectUsers" + _id;
    return (
        <div className={props.clicked ? " project-clicked display-content-wrapper" : "display-content-wrapper"}>
            <div className="content-section">
                <div className="display-content">
                    {isClickedEdit ?
                        <h5 >
                            <form onSubmit={handleEditConfirm}>
                                <input type="text"
                                    className="edit-input edit-input-color2"
                                    placeholder={name}
                                    defaultValue={name}
                                    onChange={evt => setNewName(evt.target.value)}
                                    autoFocus
                                    onBlur={() => setIsClickedEdit(false)}>
                                </input>
                            </form>
                        </h5>
                        : <h5 onClick={handleClick}>{name}</h5>}
                    <p onClick={handleClick}> Created:{" "}{getMMDDYYYY(date)}</p>
                </div>
                <div className="icon-wrapper" >
                    {props.clicked ?
                        <>
                            <i className="far fa-trash-alt"
                                onClick={() => props.handleDelete(_id)} >
                            </i>
                            <i className="far fa-edit"
                                onClick={() => setIsClickedEdit(prev => !prev)}
                                style={{ color: isClickedEdit ? "#77a186" : "" }}></i>
                            <i className="fas fa-users"
                                id="projectUsersToggler"
                                data-toggle="collapse"
                                data-target={"#" + customId}
                                aria-expanded="false"
                                aria-controls={customId}
                            >
                            </i>
                        </> : null}
                </div>
            </div>
            {props.clicked ?
                <div id={customId} className="collapse display-content">
                    <div className="content-section">
                        <h6>Participants</h6>
                        <div className="icon-wrapper">
                            {!showAddUserForm ?
                                <i className="fas fa-user-plus small-icon"
                                    onClick={() => setShowAddUserForm(prev => !prev)}>
                                </i> :
                                <i className="fas fa-user-times small-icon"
                                    onClick={() => setShowAddUserForm(prev => !prev)}>
                                </i>
                            }
                        </div>
                        <figure className="border-design dkblue">
                        </figure>
                    </div>
                    {showAddUserForm ?
                        <form className="form-create form-addUser content-section"
                            onSubmit={handleAddUserToProject}>
                            <input type="email"
                                placeholder="Add an user's email"
                                className="edit-input edit-input-color2"
                                autoFocus
                                required
                                value={addedEmail}
                                onChange={evt => setAddedEmail(evt.target.value)}>
                            </input>
                            <div className="select-wrapper" style={{ width: "4.5rem" }}>
                                <select
                                    onChange={evt => setAddedRole(evt.target.value)}
                                    className="select edit-input-color2"
                                    required
                                    defaultValue={""}>
                                    <option value="" disabled>Role</option>
                                    <option value="admin" >Admin</option>
                                    <option value="user">User</option>
                                </select>
                            </div>
                            <button type="submit"
                                style={{ border: "none", background: "#1B1C30", color: "#B1BAC7" }}>
                                Add
                            </button>
                        </form>

                        : null}

                    {props.clicked ? admins ? admins.map(admin =>
                        <div className="content-section" style={{ margin: "0.15rem 0" }}>
                            <p>
                                <span style={{
                                    background: "#FB7693", padding: "0.2rem 0.5rem",
                                    marginRight: "0.3rem", borderRadius: "10px"
                                }}>
                                    Admin
                                </span>
                                {admin.name === currentUser.name ? "You" : admin.name}
                            </p>
                        </div>
                    ) : null : null}
                    {props.clicked ? users ? users.map(user =>
                        <div className="content-section" style={{ margin: "0.15rem 0" }}>
                            <p>
                                <span style={{
                                    background: "#12111a", color: "#B1BAC7", padding: "0.2rem 0.5rem",
                                    marginRight: "0.3rem", borderRadius: "10px"
                                }}>
                                    Participant
                                </span>
                                {user.name === currentUser.name ? "You" : user.name}
                            </p>
                            <i className="fas fa-user-minus small-icon" id={"added" + user._id}
                                onClick={e => handleDeleteUser("added" + user._id, e)}>
                            </i>
                        </div>
                    ) : null : null}
                </div> : null}
        </div>

    )
}

export default DisplayProject;
