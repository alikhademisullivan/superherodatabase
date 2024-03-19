import { Redirect, Link } from 'react-router-dom';
import AuthContext from './AuthContext';
import React, { useState, useEffect, useContext } from 'react';
import './Authenticated.css';
import AdminPage from './AdminPage'; // Import the AdminPage component
import profileImage from './profile.png';


const Authenticated = () => {
  const { isLoggedIn, setIsLoggedIn, userEmail, userNickname, isAdmin, setIsAdmin } = useContext(AuthContext); // variables i need to keep track of page to page

  const handleLogout = () => {
    setIsLoggedIn(false); // send back to start page if user logs out
    setIsAdmin(false);
  };



  return (
    <div className='authenticated-page-container'>
      <div className="profile-info">
        {isLoggedIn && (
          <>
            <img src={profileImage} alt="Profile" />
            <span>{userEmail}</span>
          </>
        )}
      </div>
      <h1>Welcome, you are logged in!</h1>
      <button onClick={handleLogout}>Logout</button>
      <Link className="nav-link" to="/">Go to Home</Link>
      {isAdmin && <Link className="nav-link" to="/admin">Go to Admin Page</Link>}
      <CreateList userEmail={userEmail} userNickname={userNickname} />

      <PublicHeroLists />

    </div>

  );
};

const CreateList = () => {
  const { userEmail, userNickname } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [description, setDescription] = useState(''); // more variables for setting each variable in a list
  const [superHeros, setSuperHeros] = useState('');
  const [visibility, setVisibility] = useState('private');

  const handleSubmit = async (event) => {// when user submits a list
    event.preventDefault();

    const response = await fetch('/api/superheroinfo/createList', {// calls create list backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,//passes all needed variables and sets useremail and nickname
        superHeros,
        creatorEmail: userEmail,
        creatorNickname: userNickname,
        visibility,
      }),
    });

    const data = await response.json();

    if (data.message) {
      alert(data.message);//tells user what happened in backend
    } else {
      alert('Error creating list.');// tells user there was an error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create List:</h1>
      <label>
        Name:
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Description:
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Super Heroes:
        <input type="text" placeholder='id,id,id,id,id' value={superHeros} onChange={(e) => setSuperHeros(e.target.value)} required />
      </label>
      <label>
        Visibility:
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
      </label>
      <button type="submit">Create List</button>
    </form>
  );
};

const EditListModal = ({ list, onClose, onSave }) => {//for displaying the edit list popup when user clicks button
  const [description, setDescription] = useState(list.description);
  const [superHeros, setSuperHeros] = useState(list.superHeros);//variables for editing list
  const [visibility, setVisibility] = useState(list.visibility);

  const handleSubmit = (event) => {//when user submits changes
    event.preventDefault();
    onSave({ ...list, description, superHeros, visibility });// passes needed variables to frontend funciton
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <form onSubmit={handleSubmit}>
          <label>
            Description:
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <label>
            Super Heroes:
            <input type="text" value={superHeros} onChange={e => setSuperHeros(e.target.value)} />
          </label>
          <label>
            Visibility:
            <select value={visibility} onChange={e => setVisibility(e.target.value)}>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </label>
          <div className='buttondiv'>
            <button className="close-button" onClick={onClose}>Cancel</button>

            <button className="save-button" type="submit">Save changes</button>
          </div>

        </form>
      </div>
    </div>
  );
};





const PublicHeroLists = () => {// displaying user lists
  const { userEmail, userNickname } = useContext(AuthContext);

  const [heroLists, setHeroLists] = useState([]);// variables for functionality
  const [expandedList, setExpandedList] = useState(null);
  const [expandedHero, setExpandedHero] = useState(null);

  const fetchHeroLists = async () => {//gets all the user lists
    try {
      const response = await fetch(`/api/superheroinfo/userLists/${userEmail}`);//gets lists by user logged in email
      const lists = await response.json();
      const data = await Promise.all(lists.map(async list => {
        const heroesResponse = await fetch(`/api/superheroinfo/superheroes/${list.superHeros}`);//gets information for each hero in list
        const heroes = await heroesResponse.json();
        return { ...list, heroes };// retuns list along with hero information
      }));
      setHeroLists(data);// sets variable to this data
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchHeroLists();
  }, []);// gets the lists upon page open

  const refreshData = () => {// refresh the list table for when after creating a list
    fetchHeroLists();
  };

  const deleteList = (listName) => {// deleting a list
    fetch(`/api/superheroinfo/deleteList/${listName}`, {// deletes list by listname
      method: 'DELETE',
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'List deleted successfully.') {
          // Refresh the data or remove the deleted list from the state
          refreshData();// refreshes data when list is deleted
        } else {
          console.error('Error deleting list:', data.message);//tells user error occured
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };



  const toggleExpandList = (index) => {// for expanding or unexpanding a list
    if (expandedList === index) {
      setExpandedList(null);
    } else {
      setExpandedList(index);
    }
  };

  const toggleExpandHero = (index) => {// for expanding or unexpanding a hero
    if (expandedHero === index) {
      setExpandedHero(null);
    } else {
      setExpandedHero(index);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentList, setCurrentList] = useState(null);// variables for lists and modal

  const openModal = (list) => {// for opening the edit modal
    setCurrentList(list);
    setIsModalOpen(true);
  };

  const closeModal = () => {// for closing the edit modal
    setIsModalOpen(false);
  };

  const saveChanges = async (newList) => {//for saving the changes of editing a list
    const response = await fetch(`/api/superheroinfo/editList/${newList.name}`, {//calls backend edit list
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newList)// sends the new list to the backend
    });
    const data = await response.json();
    console.log(data);
    closeModal();//closes edit popup
    fetchHeroLists();// refetches lists to update edits
  };




  return (
    <div className="public-hero-lists">
      {isModalOpen && (
        <EditListModal
          list={currentList}
          onClose={closeModal}
          onSave={saveChanges}
        />
      )}
      <h2>My Lists</h2>
      <button onClick={refreshData}>Refresh</button>
      <table className="hero-lists-table">
        <thead>
          <tr>
            <th>List Name</th>
            <th>Description</th>
            <th>Creator's Nickname</th>
            <th>Number of Heroes</th>
            <th>Visibility</th>
            <th>Show</th>
            <th>Edit</th>
            <th>Delete</th>


          </tr>
        </thead>
        <tbody>
          {heroLists.map((list, index) => (
            <React.Fragment key={index}>
              <tr>
                <td>{list.name}</td>
                <td>{list.description}</td>

                <td>{list.creatorNickname}</td>
                <td>{list.numberOfHeroes}</td>
                <td>{list.visibility}</td>
                <td>
                  <button onClick={() => toggleExpandList(index)}>
                    {expandedList === index ? 'Hide Heroes' : 'Show Heroes'}
                  </button>
                </td>
                <td>
                  <button onClick={() => openModal(list)}>Edit</button>
                </td>
                <td>
                  <button onClick={() => {
                    if (window.confirm('Are you sure you want to delete this list?')) {
                      deleteList(list.name);//if confirms a list to delete it deletes this list
                    } else {
                      window.alert("List not Deleted")
                    }

                  }}>Delete</button>
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
    </div>
  );
};




export default Authenticated;
