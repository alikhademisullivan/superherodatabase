import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from './AuthContext';
import './AdminPage.css';
import profileImage from './profile.png';

const AdminPage = () => {
    const { setIsLoggedIn, setUserEmail, setUserNickname, isAdmin, setIsAdmin, isLoggedIn, userEmail } = useContext(AuthContext);
    const [users, setUsers] = useState([]); //variables i need to keep track of
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        fetch('/api/superheroinfo/users')//gets users
            .then(response => response.json())
            .then(data => setUsers(data));

        fetch('/api/superheroinfo/reviews')// gets reviews
            .then(response => response.json())
            .then(data => setReviews(data));
    }, []);

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUserEmail(null);//when user logs out it takes them back to start page as these are set to false
        setUserNickname(null);
        setIsAdmin(false)
    };

    const handleUserStatusChange = (email, isDisabled) => {//for changing if a user is disabled or not
        fetch(`/api/superheroinfo/user/${email}`, {//calls disabled changing backend
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isDisabled }),//passes disabled 1 or 0
        })
            .then(() => {
                // Refresh the users
                fetch('/api/superheroinfo/users')//refetches the user table
                    .then(response => response.json())
                    .then(data => setUsers(data));
            });
    };
    const handleAdminStatusChange = (email, isAdmin) => {// for changing if a user is admin or not
        fetch(`/api/superheroinfo/userAdmin/${email}`, {//calls backend to change user admin status
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isAdmin }),// passes 0 or 1 for admin or not admin
        })
            .then(() => {
                // Refresh the users
                fetch('/api/superheroinfo/users')// refetches user table
                    .then(response => response.json())
                    .then(data => setUsers(data));
            });
    };

    const handleReviewStatusChange = (id, hidden) => {// for setting a review to hidden or non hidden
        fetch(`/api/superheroinfo/review/${id}`, {//calls backend and passed review id to change hidden status
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hidden }),// passes 1 or 0 for hidden or not hidden
        })
            .then(() => {
                // Refresh the reviews
                fetch('/api/superheroinfo/reviews')
                    .then(response => response.json())
                    .then(data => setReviews(data));
            });
    };

    return (
        <div>
            <h1>Admin Page</h1>
            <div className="profile-infoAdmin">

                {isLoggedIn && (
                    <>
                        <img src={profileImage} alt="Profile" />
                        <span>{userEmail}</span>
                    </>
                )}
            </div>
            <button onClick={handleLogout}>Logout</button>
            <Link className="nav-link" to="/">Go to Start Page</Link>
            <Link className="nav-link" to="/loggedin">Go to Authenticated Page</Link>
            
            <h2>Users</h2>
            <div className="tables-container">

                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Nickname</th>
                            <th>Is Disabled</th>
                            <th>Is Admin</th>
                            <th>Disable</th>
                            <th>Admin</th>

                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.email}>
                                <td>{user.email}</td>
                                <td>{user.nickname}</td>
                                <td>{user.isDisabled ? 'Yes' : 'No'}</td>
                                <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                                <td>
                                    <button onClick={() => handleUserStatusChange(user.email, !user.isDisabled)}>
                                        {user.isDisabled ? 'Enable' : 'Disable'}
                                    </button>
                                </td>
                                <td>
                                    <button onClick={() => handleAdminStatusChange(user.email, !user.isAdmin)}>
                                        {user.isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <h2>Reviews</h2>
            <div className="tables-container">

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Rating</th>
                            <th>Comment</th>
                            <th>Is Hidden</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map(review => (
                            <tr key={review.ReviewID}>
                                <td>{review.ReviewID}</td>
                                <td>{review.Rating}</td>
                                <td>{review.Comment}</td>
                                <td>{review.hidden ? 'Yes' : 'No'}</td>
                                <td>
                                    <button onClick={() => handleReviewStatusChange(review.ReviewID, !review.hidden)}>
                                        {review.hidden ? 'Show' : 'Hide'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPage;