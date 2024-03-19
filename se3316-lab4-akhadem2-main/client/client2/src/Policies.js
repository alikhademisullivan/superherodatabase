import React, { useState, useEffect, useContext } from 'react';
import AuthContext from './AuthContext';
import './Policies.css';
import { Redirect, Link } from 'react-router-dom';
import profileImage from './profile.png';

const Policies = () => {
    const { isLoggedIn, setIsLoggedIn, userEmail, userNickname ,isAdmin,setIsAdmin} = useContext(AuthContext);
    const [selectedPolicy, setSelectedPolicy] = useState('');//all the variable i need to keep track of
    const [editorContent, setEditorContent] = useState('');
    const [policies, setPolicies] = useState([]);

    useEffect(() => {
        // Fetch all policies when the component mounts
        fetch(`/api/superheroinfo/policies`)//gets all the policies 
            .then(res => res.json())
            .then(data => {
                setPolicies(data);// sets policy to variable
                if (data.length > 0) {
                    setSelectedPolicy(data[0].policy_name);//sets selected policy to first policy
                    setEditorContent(data[0].policy_content);//sets the editor to the policies to allow editing
                }
            });
    }, []);

    const handlePolicyChange = (event) => {// when the policy selector is changed
        const name = event.target.value;
        setSelectedPolicy(name);//sets variable to keep track of name

        const policy = policies.find(policy => policy.policy_name === name);
        if (policy) {
            setEditorContent(policy.policy_content);//sets the content to the policies content
        }
    };

    const handleContentChange = (event) => {
        setEditorContent(event.target.value);//handle content change sets variable to the updated content
    };
    const handleLogout = () => {
        setIsLoggedIn(false);
        setIsAdmin(false);//when user logs out it dissapears admin fuctionality
      };

    const handleSave = async () => {
        // Save the updated policy to the server
        await fetch(`/api/superheroinfo/policies/${selectedPolicy}`, {// calls backend to update selected pollicy
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: editorContent }),// passes the new content
        });

        // Refresh the policies after saving
        fetch(`/api/superheroinfo/policies`)// refetches the policies on the page
            .then(res => res.json())
            .then(data => setPolicies(data));
    };

    return (
        <div id="policies-page">
            <div className="profile-info">
                {isLoggedIn && (
                    <>
                        <img src={profileImage} alt="Profile" />
                        <span>{userEmail}</span>
                    </>
                )}
            </div>
            <Link className="nav-link" to="/">Go to Home</Link>
    
            {isLoggedIn && <Link className="nav-link" to="/loggedin">Go to Authenticated Page</Link>}
            {isAdmin && <Link className="nav-link" to="/admin">Go to Admin Page</Link>}
            {isLoggedIn &&<button onClick={handleLogout}>Logout</button>}

            
            {isAdmin && (
                <div className="admin-panel">
                    <h1>Admin Panel</h1>
                    <select value={selectedPolicy} onChange={handlePolicyChange}>
                        {policies.map((policy, index) => (
                            <option key={index} value={policy.policy_name}>{policy.policy_name}</option>
                        ))}
                    </select>
                    <div>
                        <textarea value={editorContent} onChange={handleContentChange} />
                        <button onClick={handleSave}>Save</button>
                    </div>
                </div>
            )}
            <h1>Policy Viewer</h1>
            <div className="policy-viewer">
                {policies.map((policy, index) => (
                    <div key={index}>
                        <h2>{policy.policy_name.split(' ').map(word=>word.toUpperCase())}</h2>
                        <p>{policy.policy_content}</p>
                    </div>
                ))}
            </div>
            <div className="dmca-form">
                <DMCAInstructons/>
                <DMCAForm/>
                {isAdmin && <AdminDMCAForm/>}
            </div>
        </div>
    );
}

const DMCAForm = () => {// form for dmca requests
    const [reviews, setReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState('');
    const [type, setType] = useState('');//needed variables

    // Fetch reviews when the component mounts
    useEffect(() => {
        fetch('/api/superheroinfo/reviews')
            .then(res => res.json())
            .then(data => setReviews(data));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const response = await fetch('/api/superheroinfo/dmca', {// adds dmca request using backend fucntion
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ReviewID: selectedReview, Type: type }),// passes review and type to backend
        });
        if (response.ok) {
            alert('DMCA log submitted successfully.');// tells user dmca successfully created
            
        } else {
            alert('Failed to submit DMCA log.');//tells user dmca log failed
        }

    };

    return (
        <form id="policies-page" onSubmit={handleSubmit}>
            <h1>Submit a DMCA Log</h1>
    
            <label>
                Select a review:
                <select value={selectedReview} onChange={e => setSelectedReview(e.target.value)}>
                    {reviews.map(review => (
                        <option key={review.ReviewID} value={review.ReviewID}>{review.Comment}</option>
                    ))}
                </select>
            </label>
    
            <label>
                Select log type:
                <select value={type} onChange={e => setType(e.target.value)}>
                    <option value="TakedownRequest">Takedown Request</option>
                    <option value="InfringementNotice">Infringement Notice</option>
                    <option value="DisputeClaim">Dispute Claim</option>
                </select>
            </label>
    
            <button type="submit">Submit</button>
        </form>
    );
};

const DMCAInstructons = () => {//document on policies page with instructions for using dmca log
    const { isLoggedIn, setIsLoggedIn, userEmail, userNickname ,isAdmin} = useContext(AuthContext);

    return (
        <div className="DMCAInstruct">
            <h1>DMCA Notice & Takedown Policy Implementation Guide</h1>
            <h2>Introduction</h2>
            <p>This document provides a comprehensive guide on the workflow and usage of tools for implementing the Digital Millennium Copyright Act (DMCA) notice and takedown policy. The guide is intended for the Site Manager (SM) and includes instructions for using the provided tools.</p>
            <h2>Workflow</h2>
            <ol>
                <li>Fetching Reviews: When the DMCAForm component mounts, it fetches reviews from the server using the fetch API and stores them in the reviews state variable.</li>
                <li>Selecting a Review and Log Type: The user can select a review and a log type (Takedown Request, Infringement Notice, or Dispute Claim) from the dropdown menus in the form.</li>
                <li>Submitting the Form: When the form is submitted, the handleSubmit function is triggered. This function sends a POST request to the server with the selected review and log type. The server then logs this DMCA action.</li>
                {isAdmin && <li>Selecting a Log Entry for Editing (Admin): The admin can select a log entry from a dropdown menu in the AdminDMCAForm component. The selected log entry’s details are fetched from the server and displayed in the form.</li>}
                {isAdmin &&<li>Editing a Log Entry (Admin): The admin can edit the details of the selected log entry in the form. The changes are saved to the server when the form is submitted.</li>}

            </ol>
            <h2>Usage of Tools</h2>
            <p>The tools used in this workflow include:</p>
            <ul>
                <li>React's useState and useEffect Hooks: The useState hook is used to manage the state of the reviews, the selected review, and the log type. The useEffect hook is used to fetch the reviews from the server when the component mounts.</li>
                <li>Fetch API: The fetch API is used to make GET and POST requests to the server. The GET request fetches the reviews, and the POST request sends the selected review and log type to the server.</li>
                <li>JSX: JSX is used to render the form and handle user interactions. It allows the user to select a review and a log type, and submit the form.</li>
            </ul>
            <h2>Conclusion</h2>
            <p>This document provides a detailed description of the workflow and usage of tools for implementing the DMCA notice & takedown policy. By following this guide, the SM can effectively manage DMCA actions on the site. If you have any questions or need further clarification, please don't hesitate to ask.</p>
        </div>
    );
};

  

const AdminDMCAForm = () => {
    const [logID, setLogID] = useState('');
    const [logEntries, setLogEntries] = useState([]);//needed variables
    const [selectedLogEntry, setSelectedLogEntry] = useState(null);

    // Fetch log entries when the component mounts
    const fetchLogEntries = () => {
        fetch('/api/superheroinfo/dmca')//gets all the dmca logs to use in selector
            .then(res => res.json())
            .then(data => setLogEntries(data))
            .catch(error => console.error('Error fetching logs:', error));
    };

    useEffect(() => {
        fetchLogEntries();// fetches all log ids for use in selector
    }, []);

    // Fetch the selected log entry when the log ID changes
    useEffect(() => {
        if (logID) {
            fetch(`/api/superheroinfo/dmca/${logID}`)// gets the information for the logid by logid in the backend
                .then(res => res.json())
                .then(data => setSelectedLogEntry(data))
                .catch(error => console.error('Error fetching log:', error));
        }
    }, [logID]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(`/api/superheroinfo/dmca/${logID}`, {//fetches dmca row by logid in backend
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedLogEntry),//passes logid
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            alert('DMCA log entry updated successfully.');//alerts user dmca added successfully
        } catch (error) {
            console.error('An error occurred:', error);
            alert(`Error updating DMCA log entry: ${error.message}`);
        }
    };

    const handleInputChange = (event) => {// on the change of any of the values it stores the new value
        setSelectedLogEntry({
            ...selectedLogEntry,
            [event.target.name]: event.target.value,
        });
    };

    const handleRefresh = () => {
        // Call the fetchLogEntries function to refresh the log entries
        fetchLogEntries();
    };

    return (
        <form id="AdminDMCA" onSubmit={handleSubmit}>
            <h1>Edit a DMCA Log Entry</h1>

            <label>
                Select a log entry:
                <select value={logID} onChange={e => setLogID(e.target.value)}>
                    <option disabled={logID !== ''} selected>Please select a Log</option>
                    {logEntries.map(entry => (
                        <option key={entry.LogID} value={entry.LogID}>{entry.LogID}</option>
                    ))}
                </select>
            </label>
            <button type="button" onClick={handleRefresh}>Refresh</button>

            {selectedLogEntry && (
                <>
                    <label>
                        Review ID:
                        <input type="text" name="ReviewID" value={selectedLogEntry.ReviewID} onChange={handleInputChange} />
                    </label>

                    <label>
                        Type:
                        <select value={selectedLogEntry.Type} onChange={handleInputChange}>
                            <option value="TakedownRequest">Takedown Request</option>
                            <option value="InfringementNotice">Infringement Notice</option>
                            <option value="DisputeClaim">Dispute Claim</option>
                        </select>
                    </label>

                    <label>
                        Date Notice Sent:
                        <input type="date" name="DateNoticeSent" value={selectedLogEntry.DateNoticeSent ? new Date(selectedLogEntry.DateNoticeSent).toISOString().split('T')[0] : ''} onChange={handleInputChange} />
                    </label>

                    <label>
                        Date Dispute Received:
                        <input type="date" name="DateDisputeReceived" value={selectedLogEntry.DateDisputeReceived ? new Date(selectedLogEntry.DateDisputeReceived).toISOString().split('T')[0] : ''} onChange={handleInputChange} />
                    </label>

                    <label>
                        Notes:
                        <input name="Notes" value={selectedLogEntry.Notes} onChange={handleInputChange} />
                    </label>

                    <label>
                        Status:
                        <select name="Status" value={selectedLogEntry.Status} onChange={handleInputChange}>
                            <option value="Active">Active</option>
                            <option value="Processed">Processed</option>
                        </select>
                    </label>
                </>
            )}

            <button type="submit">Submit</button>
        </form>
    );
};




export default Policies;