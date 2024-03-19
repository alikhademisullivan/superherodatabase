import logo from './logo.svg';
import './App.css';
import React from 'react';
import StartPage from './StartPage';
import Authenticated from './Authenticated';

import { useState } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import AdminPage from './AdminPage'; // Import the AdminPage component

import AuthContext from './AuthContext';
import Policies from './Policies';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(null);//variables i need to keep track of across pages
  const [userNickname, setUserNickname] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  return (//adds this to keep track of these variables in all pages inside this tag
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userEmail, setUserEmail, userNickname, setUserNickname, isAdmin, setIsAdmin }}>
      <Router>
        <Switch>
          <Route exact path="/">
            <StartPage />
          </Route>
          {/* Route for logged in in users */}
          <Route path="/loggedin">
            {isLoggedIn ? <Authenticated /> : <Redirect to="/" />}
          </Route>
          {/* Route for admin in users */}
          <Route path="/admin">
            {isAdmin ? <AdminPage /> : <Redirect to="/" />}
          </Route>
          {/* Route for policies  */}
          <Route path="/policy">
            <Policies />
          </Route>
        </Switch>
      </Router>
    </AuthContext.Provider>
  );
};


export default App;








