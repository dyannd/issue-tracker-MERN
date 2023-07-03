import React from 'react';
import { Redirect, Route, BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import Dashboard from './Components/Dashboard';
import SignIn from './Components/SignIn';
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
