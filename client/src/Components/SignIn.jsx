import React from 'react';
import './SignIn.css';
import axios from 'axios';
import { BrowserRouter as Router, Route, Switch, useHistory } from 'react-router-dom';

function SignIn(props) {
  const history = useHistory();
  //Make states
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [hasAccount, setHasAccount] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);



  //handle log in route
  function handleLogin(event) {
    event.preventDefault();
    setIsLoading(true);
    axios({
      method: "POST",
      data: {
        email: email,
        password: password
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
              placeholder="Password"
              required
              value={password2}
              error={errors.password2}
              onChange={evt => setPassword2(evt.target.value)} />}
          <p className="error-text">{errors.password2 ? errors.password2 : null}</p>

          <div className="button-wrapper">
            {hasAccount ? (
              <>
                <p className="switcher-text">  Haven't got an account yet?
                  <span className="click-text"
                    onClick={() => {
                      setHasAccount(prev => !prev);
                      setErrors({});
                    }}> Join us</span>
                </p>
                <button className="function-button" type="submit" onClick={handleLogin}>
                  {isLoading ? <div className="loader-signin"></div> : "Sign in"}
                </button>

              </>
            ) : <>

              <p className="switcher-text"> Have an account?
                <span className="click-text"
                  onClick={() => {
                    setHasAccount(prev => !prev);
                    setErrors({});
                  }}> Sign In</span>
              </p>
              <button className="function-button" type="submit" onClick={handleSignUp} >
                {isLoading ? <div className="loader"></div> : "Sign up"}
              </button>
            </>
            }

          </div>

        </form>
      </div>


    </div>
  )
}

export default SignIn;