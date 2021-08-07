import React from 'react';
import "./NavBar.css";
import { BrowserRouter as Link } from 'react-router-dom';
function NavBar(props) {
    const { name, handleLogOut, noti, width } = props;
    const notiClone = [...noti];
    const [totalNoti, setTotalNoti] = React.useState(0);
    const [showNoti, setShowNoti] = React.useState(false);

    React.useEffect(() => {
        setTotalNoti(noti.filter(not => not.read === 0).length);
    }, [noti])

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

    function handleReadNoti() {
        setShowNoti(prev => !prev);
        if (noti.length > 0) {
            props.handleReadNoti();
        }

    }
    return (
        <nav className="navbar navbar-expand-lg fixed-top">
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
                    <li>
                        {width >= 992 ?
                            <div className="icon-wrapper  notification-button">
                                {totalNoti > 0 ? <div className="notification-counter"><p>{totalNoti}</p></div> : null}
                                <i className="far fa-bell "
                                    onClick={handleReadNoti}>
                                </i>
                            </div>
                            : null}
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
            {width < 992 ?
                <div style={{position:"absolute", height:"8vh", top:"0.1rem", right:"3rem"}}>
                    <div className="icon-wrapper  notification-button" style={{height:"1.2rem", margin:"auto", top:"2.6vh"}}>
                        {totalNoti > 0 ? <div className="notification-counter"><p>{totalNoti}</p></div> : null}
                        <i className="far fa-bell "
                            onClick={handleReadNoti}>
                        </i>
                    </div>
                </div>

                : null}

            {showNoti ?
                <div className="noti-menu">
                    <ul>
                        {notiClone ? notiClone.reverse().map(noti =>
                            <li className="noti-item content-section"
                                style={{ background: noti.read === 0 ? "#91DEFB" : "", color: noti.read === 0 ? "#12111a" : "" }}>
                                <div>
                                    <p>{noti.content}</p>
                                    <p>{getMMDDYYYY(noti.date)}</p>
                                </div>
                                <i className="fas fa-times" onClick={(e) => props.handleDeleteNoti(e, noti)}></i>
                            </li>
                        ) : null}
                    </ul>
                </div>
                : null}
        </nav>
    )
}

export default NavBar;