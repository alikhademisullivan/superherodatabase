import React, { useState, useEffect, useContext } from 'react';
import { Redirect, Link } from 'react-router-dom';
import AuthContext from './AuthContext';
import './StartPage.css';
import { useRef } from 'react';
import AdminPage from './AdminPage'; // Import the AdminPage component
import profileImage from './profile.png';

// Start Page Component

const StartPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { isLoggedIn, setIsLoggedIn, userEmail, setUserEmail, userNickname, setUserNickname, isAdmin, setIsAdmin } = useContext(AuthContext);
  const [isResendVerification, setIsResendVerification] = useState(false);//variables i need to keep trackof
  const [verificationToken, setVerificationToken] = useState('');

  const handleLogin = async () => {
    // Create a user object
    const user = {
      email: email,
      password: password
    };//sends this to the backend to login
    
    // Make a POST request to the /login route
    let response = await fetch('/api/superheroinfo/login', {//truns login backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)//sends user info password and email
    });

    if (response.status === 403) {//if the account hasnt been varified backend sends 403
      const shouldResend = window.confirm('Account is not verified. Would you like to resend the verification email?');//asks user if they want to resend verification
      if (shouldResend) {
        setIsResendVerification(true);//if they says yes open verification window
        const resendResponse = await fetch('/api/superheroinfo/resendVerificationEmail', {//resends email
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(user)
        });
        if (resendResponse.ok) {//tells user email has been sent
          window.alert('Verification email sent.');
        } else {//tells user it didnt send email
          window.alert('Error resending verification email.');
        }
      }
    } else if (!response.ok) {
      window.alert("Error Occured")//tells user error occured
      
    }
    // If the login is successful, set isLoggedIn to true
    if (response.ok) {
      setIsLoggedIn(true);
      setUserEmail(email);

      // Fetch the user's nickname
      response = await fetch(`/api/superheroinfo/user?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const userData = await response.json();

        setIsAdmin(userData.isAdmin === 1); // Update the isAdmin state

        setUserNickname(userData.nickname);//allows me to keep track of nickname when they login
      } else {
        // Handle error
        window.alert('Error fetching user information.');
      }
    } else {
      // Parse the JSON body of the response
      const data = await response.json();
      // Display the error message
      window.alert(data.message);
    }
  };
  const handleVerify = async () => {
    // Make a GET request to the /verify-email route
    const response = await fetch(`/api/superheroinfo/verify-email?token=${verificationToken}`);//calls verify backend

    if (response.ok) {
      window.alert('Email verified successfully!');//if varified set is resend verification to false to make verification tab dissapear
      setIsResendVerification(false);
    } else {
      // Parse the JSON body of the response
      const data = await response.json();
      // Display the error message
      window.alert(data.message);
    }
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
  };// sets admin and logged in to false when logging out



  return (
    <div className="start-page-container">
      <div className="container">
      <div className="profile-info">
        {isLoggedIn && (
          <>
            <img src={profileImage} alt="Profile" />
            <span>{userEmail}</span>
          </>
        )}
      </div>
      <h1>Super Hero DataBase</h1>
      <p>This is a database with information and powers of superheros. You are able to login, create a list, alter a list, delete a list, view superheros and superheros in a list. Also you may add reviews to lists to let list creators know your feelings about the list. Enjoy!</p>
      <div className='buttons'> 
      {isLoggedIn &&<button className='logout' onClick={handleLogout}>Logout</button>} {/* only viewable if logged in */}
         {isLoggedIn && <ForgotPassword />} {/* only viewable if logged in */}
      
      
     
      {isLoggedIn && <Link className="nav-link" to="/loggedin">Go to Authenticated Page</Link>} {/* only viewable if logged in */}
      {isAdmin && <Link className="nav-link" to="/admin">Go to Admin Page</Link>} {/* only viewable if admin in */}
      

      {<Link className="nav-link" to="/policy">View Policies</Link>}

      </div>

      <div className="forms-container">
        <div className="form login" style={{ opacity: isLoggedIn ? 0.5 : 1 }}>
          <h2>Login</h2>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button onClick={handleLogin} disabled={isLoggedIn}>Login</button>
          {isLoggedIn && <p>You are already logged in.</p>}
          {isResendVerification && (
        <>
          <label>
            Verification Token:
            <input type="text" value={verificationToken} onChange={e => setVerificationToken(e.target.value)} required />
          </label>
          <button onClick={handleVerify}>Verify Email</button>
        </>
      )}
        </div>

        <RegistrationForm />

      </div>
      <HeroSearch />
      <PublicHeroLists />

    </div>
    </div>

    
  );


};


const ForgotPassword = () => {
  const { isLoggedIn, setIsLoggedIn, userEmail, userNickname ,isAdmin} = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');//variables i need to keep trackof 
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = async (event) => {
      event.preventDefault();

      const response = await fetch('/api/superheroinfo/update-password', {//calles update password
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, oldPassword, newPassword }),// sends all data to backend
      });

      if (response.ok) {
        const data = await response.text();// if the responce was ok tell user password updated
        window.alert("Successfully Updated Password")

        setShowPopup(false); // Close the popup after submitting the form
        setIsLoggedIn(false)//set isloggedin to false to logout the user after update
    } else {
        const error = await response.text();
        window.alert(error)
    }
  };

  return (
      <div>
          <button onClick={(e) => {e.stopPropagation(); setShowPopup(true);}}>Forgot Password</button>

          {showPopup && (
              <div className="forgot-password-popup" onClick={e => e.stopPropagation()}>
                  <h1>Forgot Password</h1>
                  <form onSubmit={handleSubmit}>
                    <div>
                      <label>
                          Email:
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                      </label>
                      <label>
                          Old Password:
                          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                      </label>
                      <label>
                          New Password:
                          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                      </label>
                    </div>
                      
                      <button className="close-button" onClick={(e) => {e.stopPropagation(); setShowPopup(false);}}>Close</button>
                      <button type="submit">Save</button>
                  </form>
                  
              </div>
          )}
      </div>
  );
};





const RegistrationForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');//variables i need to keep track of
  const [nickname, setNickname] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);


  const [verificationToken, setVerificationToken] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/superheroinfo/register', {//calls register backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          nickname//sends needed data to backend
        })
      });

      if (response.ok) {
        alert('Registration successful! A verification email has been sent. Please check your email and enter the verification token below.');
        setIsRegistered(true);//if it went okay then it opens the varification window
      } else {
        const errorData = await response.text();
        alert(`Registration failed: ${errorData}`);//if fails tells user error
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleVerify = async () => {
    // Make a GET request to the /verify-email route
    const response = await fetch(`/api/superheroinfo/verify-email?token=${verificationToken}`);

    if (response.ok) {
      window.alert('Email verified successfully!');
      setIsRegistered(false);//tells user email verified and closes verification window
    } else {
      // Parse the JSON body of the response
      const data = await response.json();
      // Display the error message
      window.alert(data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form register">
      <h2>Register</h2>
      <p>Please click the register button once and give time to allow registation to occur</p>
      <label>
        Email:
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </label>
      <label>
        Password:
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </label>
      <label>
        Nickname:
        <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} required />
      </label>
      <input type="submit" value="Register" />
      {isRegistered && (
        <>
          <label>
            Verification Token:
            <input type="text" value={verificationToken} onChange={e => setVerificationToken(e.target.value)} required />
          </label>
          <button onClick={handleVerify}>Verify Email</button>
        </>
      )}
    </form>
  );


};

// Hero Search Component
const HeroSearch = () => {
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [power, setPower] = useState('');
  const [publisher, setPublisher] = useState('');//all variables i need to keep track of
  const [results, setResults] = useState([]);
  const [expandedHero, setExpandedHero] = useState(null);

  const searchHeroes = async () => {
    console.log('Search button clicked');
    console.log('Search parameters:', { name, race, power, publisher });//logging for testing purposes
    try {
      const response = await fetch(`/api/superheroinfo/search?name=${name}&race=${race}&power=${power}&publisher=${publisher}`);
      console.log(response);//runs search api in backend with search fields passed

      const data = await response.json();
      console.log('Search results:', data);
      setResults(data);// sets the results from the backend to a variable
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const toggleExpand = (index) => {
    if (expandedHero === index) {
      setExpandedHero(null);
    } else {
      setExpandedHero(index);
    }
  };
  const clearResults = () => {
    setResults([]);
  };


  return (
    <div className="hero-search">
      <h2>Hero Search</h2>
      <div className="search-fields">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input type="text" value={race} onChange={(e) => setRace(e.target.value)} placeholder="Race" />
        <input type="text" value={power} onChange={(e) => setPower(e.target.value)} placeholder="Power" />
        <input type="text" value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Publisher" />
        <button onClick={searchHeroes}>Search</button>
        <button onClick={clearResults}>Clear</button> {/* Add this line */}

      </div>
      {results.length > 0 && (
        <table className="results-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Publisher</th>
              <th>Details</th>
              <th>DuckDuckGo</th>
            </tr>
          </thead>
          <tbody>
            {results.map((hero, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td>{hero.name}</td>
                  <td>{hero.Publisher}</td>
                  <td>
                    <button onClick={() => toggleExpand(index)}>
                      {expandedHero === index ? 'Hide Details' : 'Show Details'}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => window.open(`https://duckduckgo.com/?q=${encodeURIComponent(hero.name + " " + hero.Publisher)}`, '_blank')}>
                      Search on DDG
                    </button>
                  </td>
                </tr>
                {expandedHero === index && (
                  <tr>
                    <td colSpan={3}>
                      Gender: {hero.Gender}<br />
                      Eye color: {hero['Eye color']}<br />
                      Race: {hero.Race}<br />
                      Hair color: {hero['Hair color']}<br />
                      Height: {hero.Height}<br />
                      Skin color: {hero['Skin color']}<br />
                      Alignment: {hero.Alignment}<br />
                      Weight: {hero.Weight}<br />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};


const PublicHeroLists = () => {
  const [heroLists, setHeroLists] = useState([]);
  const [expandedList, setExpandedList] = useState(null);
  const [expandedHero, setExpandedHero] = useState(null);
  const { isLoggedIn } = useContext(AuthContext); //creating all the variable i need to keep track of
  const { setIsLoggedIn, setUserEmail, setUserNickname } = useContext(AuthContext);
  const { userEmail, userNickname } = useContext(AuthContext);

  const fetchHeroLists = async () => {
    try {
      const response = await fetch('/api/superheroinfo/publicLists');//gets all the public lists
      const lists = await response.json();
      const data = await Promise.all(lists.map(async list => {
        const heroesResponse = await fetch(`/api/superheroinfo/superheroes/${list.superHeros}`);//gets all the informaiton for each superhero in the list
        const heroes = await heroesResponse.json();
        return { ...list, heroes };
      }));
      setHeroLists(data);//sets the variable to keep track of lists
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchHeroLists();//fetches the lists upon opening
  }, []);

  const toggleExpandList = (index) => {
    if (expandedList === index) {//function to expand or unexpand a list based off if its expanded or not
      setExpandedList(null);
    } else {
      setExpandedList(index);
    }
  };

  const toggleExpandHero = (index) => {//function to expand or unexpand a hero based off if its expanded or not
    if (expandedHero === index) {
      setExpandedHero(null);
    } else {
      setExpandedHero(index);
    }
  };

  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [currentList, setCurrentList] = useState(null);
  const ratingRef = useRef(); // more variable to keep track of
  const commentRef = useRef();

  const openReviewPopup = (listName) => {// function to open review popup with listname based on which clicked
    setCurrentList(listName);
    setShowReviewPopup(true);
  };

  const closeReviewPopup = () => {//close the review popup if clicked the close button
    setShowReviewPopup(false);
  };

  const submitReview = async () => {// submit a review if submit is clicked
    const rating = ratingRef.current.value;
    const comment = commentRef.current.value;//gets rating and comment

    try {
      const response = await fetch('/api/superheroinfo/addReview', {// calls add review backend
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Rating: rating, Comment: comment, listName: currentList, userEmail: userEmail })//passes needed variables to backend
      });

      if (response.ok) {
        alert('Review added successfully!');//tells user added successfully
        closeReviewPopup();//closes review popup 
        fetchHeroLists(); // Fetch the hero lists again after a review is added
      } else {
        throw new Error('Failed to add review');//case for when review fails
      }
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };


  return (
    <div className="public-hero-lists">
      <h2>Public Hero Lists</h2>
      <table className="hero-lists-table">
        <thead>
          <tr>
            <th>List Name</th>
            <th>Creator's Nickname</th>
            <th>Number of Heroes</th>
            <th>Avg Rating</th>
            <th>Ratings</th>
            <th>Rating Comments</th>
            <th>Show</th>
            <th>{isLoggedIn && 'Add Review'}</th>

          </tr>
        </thead>
        <tbody>
          {heroLists.map((list, index) => (
            <React.Fragment key={index}>
              <tr>
                <td>{list.name}</td>
                <td>{list.creatorNickname}</td>
                <td>{list.numberOfHeroes}</td>
                <td>{list.AverageRating}</td>
                <td>{list.ratings}</td>
                <td>{list.comments}</td>
                <td>
                  <button onClick={() => toggleExpandList(index)}>
                    {expandedList === index ? 'Hide Heroes' : 'Show Heroes'}
                  </button>
                </td>
                <td>
                  {isLoggedIn && <button onClick={() => openReviewPopup(list.name)}>Add Review</button>}
                </td>
              </tr>
              {expandedList === index && list.heroes.map((hero, heroIndex) => (
                <React.Fragment key={heroIndex}>
                  <tr>
                    <td colSpan={7}>
                      Name: {hero.name}<br />
                      Power: {hero.powers.join(', ')}<br />
                      Publisher: {hero.Publisher}
                    </td>
                    <td>
                      <button onClick={() => toggleExpandHero(heroIndex)}>
                        {expandedHero === heroIndex ? 'Hide Details' : 'Show Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedHero === heroIndex && (
                    <tr>
                      <td colSpan={8}>
                        Gender: {hero.Gender}<br />
                        Eye color: {hero['Eye color']}<br />
                        Race: {hero.Race}<br />
                        Hair color: {hero['Hair color']}<br />
                        Height: {hero.Height}<br />
                        Skin color: {hero['Skin color']}<br />
                        Alignment: {hero.Alignment}<br />
                        Weight: {hero.Weight}<br />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {showReviewPopup && (
        <div className="review-popup-overlay">
          <div className="review-popup">
            <h2>Add Review for {currentList}</h2>
            <label>
              Rating:
              <input type="number" min="0" max="10" step="0.1" ref={ratingRef} />
            </label>
            <label>
              Comment:
              <textarea ref={commentRef} />
            </label>
            <button onClick={submitReview}>Submit</button>
            <button onClick={closeReviewPopup}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};


export default StartPage;