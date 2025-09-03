import { useEffect, useState } from 'react';
import './UserData.css';

const UserData = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:9000/api/users', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                if (response.status === 401) {
                    throw new Error('You are not authorized. Please log in.');
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch user data.');
                }

                const data = await response.json();

                const usersWithDate = data.map(user => ({
                    ...user,
                    registrationDate: new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }),
                    registrationTime: new Date(user.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                    })
                }));

                setUsers(usersWithDate);
            } catch (err) {
                console.error('Fetch Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="user-data-container status-container">
                <p>Loading user data...</p>
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-data-container status-container error-message">
                <p>Error: {error}</p>
                <p>Please ensure you are logged in and have the necessary permissions.</p>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="user-data-container status-container no-data">
                <p>No registered users found. 😞</p>
                <p>Start by registering some users through the /api/auth/register endpoint.</p>
            </div>
        );
    }

    return (
        <div className="user-data-container">
            <h2>Registered Users 🧑‍🤝‍🧑</h2>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Country</th>
                            <th>Registered On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={user._id}>
                                <td data-label="ID">{index + 1}</td>
                                <td data-label="Title">{user.title || 'N/A'}</td>
                                <td data-label="First Name">{user.firstName}</td>
                                <td data-label="Last Name">{user.lastName}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="Country">{user.country}</td>
                                <td data-label="Registered On">
                                    <div className="registration-date">
                                        {user.registrationDate}
                                    </div>
                                    <div className="registration-time">
                                        {user.registrationTime}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserData;