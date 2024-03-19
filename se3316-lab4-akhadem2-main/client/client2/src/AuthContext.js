import React, { useState, createContext } from 'react';

export const AuthContext = createContext();
//this is used to carry login,admin, username,email across the different pages
export const AuthProvider = (props) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(null);//sets variables for all the values needed to keep track of
  const [userNickname, setUserNickname] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Add this line

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userEmail, setUserEmail, userNickname, setUserNickname, isAdmin, setIsAdmin }}>
      {props.children}
    </AuthContext.Provider>//creates a tag to put around pages in app.js to keep track of these values
  );
};
  
  

export default AuthContext;

