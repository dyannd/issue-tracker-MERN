import React from 'react';
import "./NavBar.css";
import { BrowserRouter as Link } from 'react-router-dom';
function NavBar(props) {
    const { name, handleLogOut } = props;
    return (
        <nav className="navbar navbar-expand-lg">
            <span className="navbar-brand"  >{"<i>ssueTracker"}</span>
            <button className="navbar-toggler"
                type="button" data-toggle="collapse"
                data-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
                style={{ color: "#B1BAC7", padding: "0" }}>
                <i className="fas fa-th-list"></i>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ml-auto">
                    <li className="nav-item">
                        <p>v0.2! Added realtime connections and UI modify! </p>
                    </li>
                    <li className="nav-item">
                        <p>Welcome {name}!</p>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" >Home <span className="sr-only">(current)</span></Link>
                    </li>
                    <li className="nav-item">
                        <button className="function-button button-small"  
                            onClick={handleLogOut}>
                            {props.loading ?
                                <div className="loader"
                                    style={{ margin: "auto", borderTopColor: "#FFFFFF" }}>
                                </div> :
                                "Log out"}
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    )
}

export default NavBar;