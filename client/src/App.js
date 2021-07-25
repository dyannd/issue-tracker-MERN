import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Redirect, useHistory } from 'react-router-dom';
import SignIn from './Components/SignIn';
import Dashboard from './Components/Dashboard';
function App() {
 
  return (
    <Router>
      <div className="App">
        <Route exact path="/">
          <Redirect to="/dashboard"/>
        </Route>
        <Route exact path="/loginOrRegister">
          <SignIn/>
        </Route>
        <Route exact path="/dashboard">
          <Dashboard/>
        </Route>
      </div>
    </Router>

  )
}

export default App;
