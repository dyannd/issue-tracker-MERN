import React from 'react';

function PopUp(props) {
    const { content, type } = props;
    function handleClick(){
        props.handleClick()
    }

    function handleClickOk(){
        props.handleClick(true);
    }

    function handleClickCancel(){
        props.handleClick(false);
    }
    return (
        <div className="pop-up">
            <p>{content}</p>
            {type === "error" ?
                <button className="function-button" onClick={handleClick}>OK</button>
                : <div className="content-section" style={{marginBottom:"1.5rem"}}>
                    <button className="function-button" onClick={handleClickOk}>OK</button>
                    <button className="function-button" onClick={handleClickCancel}>Cancel</button>
                </div>}
        </div>
    )
}

export default PopUp;