import axios from 'axios';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './SignIn.css';

function SignIn(props) {
  const history = useHistory();
  //Make states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errors, setErrors] = useState({});
  const [hasAccount, setHasAccount] = useState(true);
  const [isLoading, setIsLoading] = useState(false);


  //handle log in route
  function handleLogin(event, opt) {
    if (opt!=="demo"){
      event.preventDefault();
    }
    setIsLoading(true);
    axios({
      method: "POST",
      data: {
        email: opt==="demo" ? "demo@demo.com" : email,
        password: opt==="demo"  ? "demodemo" : password
      },
      url: "/api/login",
      withCredentials: true
    }).then(res => {
      console.log(res);
      setIsLoading(false);
      //if server response good, set current user to the data received
      if (res.status === 200) {
        localStorage.setItem('accessToken', res.data.accessToken)
        history.push("/dashboard")
      }
    }).catch(error => {
      setIsLoading(false);
      //else get the error and display it
      setErrors(error.response.data);
    })
  }

  function handleSignUp(event) {
    event.preventDefault();
    setIsLoading(true);
    axios({
      method: "POST",
      data: {
        name: name,
        email: email,
        password: password,
        password2: password2
      },
      url: "/api/register",
      withCredentials: true
    }).then(res => {
      setIsLoading(false);
      //if the server response good, direct to login
      if (res.status === 200) {
        setHasAccount(prev => !prev);
      }

    }).catch(error => {
      setIsLoading(false);
      //else log the faulty stuff
      setErrors(error.response.data);
    })
  }



  return (
    <div className="signin-screen row">
      <div className="col-12 col-md-4  signin-illustration">

      </div>
      <div className="col-12 col-sm-12 col-md-8 signin-form-wrapper">
        <form noValidate className="signin-form">
          <h1>{hasAccount ? "Sign In" : "Sign Up"}</h1>
          <h6>{"<i>ssueTracker"}</h6>
          {hasAccount ? null :
            <>
              <input className="signcomponent"
                type="text"
                id="name"
                placeholder="Name"
                autoFocus
                required
                value={name}
                onChange={evt => setName(evt.target.value)} />
              <p className="error-text">{errors.name ? errors.name : null}</p>
            </>}

          <input className=" signcomponent"
            type="email" id="email"
            placeholder="E-mail"
            autoFocus
            required
            value={email}
            onChange={evt => setEmail(evt.target.value)} /><br />
          <p className="error-text">{errors.email ? errors.email : ""}</p>

          <input className="signcomponent"
            type="password"
            id="password"
            placeholder="Password"
            required
            value={password}
            onChange={evt => setPassword(evt.target.value)} /><br />
          <p className="error-text">{errors.password ? errors.password : null}</p>

          {hasAccount ? null :
            <input className="signcomponent"
              type="password"
              id="password2"
              placeholder="Confirm Password"
              required
              value={password2}
              error={errors.password2}
              onChange={evt => setPassword2(evt.target.value)} />}
          <p className="error-text">{errors.password2 ? errors.password2 : null}</p>

          <div className="button-wrapper">
            {hasAccount ? (
              <>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <p className="switcher-text"> Just got here?
                    <span className="click-text"
                      onClick={() => {
                        setHasAccount(prev => !prev);
                        setErrors({});
                      }}>
                      {" "}Join Us{" "}
                    </span>
                  </p>
                  <button className="function-button sign-button" type="submit" onClick={handleLogin}>
                    {isLoading ? <div className="loader-signin"></div> : "Sign in"}
                  </button>
                  <button className="function-button sign-button" type="button" style={{margin:0}}
                    onClick={(e) => {
                      handleLogin(e, "demo");
                    }}>
                    {isLoading ? <div className="loader-signin"></div> : "Try Demo"}
                  </button>
                </div>


              </>
            ) : <>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <p className="switcher-text"> Have an account?
                  <span className="click-text"
                    onClick={() => {
                      setHasAccount(prev => !prev);
                      setErrors({});
                    }}>
                    {" "} Sign In
                  </span>
                </p>
                <button className="function-button sign-button" type="submit" onClick={handleSignUp} >
                  {isLoading ? <div className="loader-signin"></div> : "Sign up"}
                </button>
              </div>

            </>
            }

          </div>

        </form>
      </div>


    </div>
  )
}

export default SignIn;