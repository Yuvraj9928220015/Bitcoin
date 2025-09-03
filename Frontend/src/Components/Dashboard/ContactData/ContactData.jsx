import { useEffect, useState } from 'react';
import './ContactData.css'; // Assuming you have this CSS file for styling

const ContactData = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
            setError(null);
            try {
                // IMPORTANT: Changed endpoint to '/api/contact'
                const response = await fetch('http://localhost:9000/api/contact', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include' // Important for sending cookies if your auth uses them
                });

                if (response.status === 401) {
                    throw new Error('You are not authorized. Please log in to view contact submissions.');
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch contact data.');
                }

                const data = await response.json();

                const contactsWithFormattedDates = data.map(contact => ({
                    ...contact,
                    submissionDate: contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }) : 'N/A',
                    submissionTime: contact.createdAt ? new Date(contact.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                    }) : 'N/A'
                }));

                setContacts(contactsWithFormattedDates);
            } catch (err) {
                console.error('Fetch Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, []);

    if (loading) {
        return (
            <div className="contact-data-container status-container">
                <p>Loading contact data...</p>
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="contact-data-container status-container error-message">
                <p>Error: {error}</p>
                <p>Please ensure you are logged in and have the necessary permissions to view contact submissions.</p>
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="contact-data-container status-container no-data">
                <p>No contact submissions found. 😞</p>
                <p>Users can submit contacts through your contact form.</p>
            </div>
        );
    }

    return (
        <div className="contact-data-container">
            <h2>Contact Submissions 📧</h2>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Country</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Submission Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((contact, index) => (
                            <tr key={contact._id || index}> {/* Use _id if available, otherwise index */}
                                <td data-label="#">{index + 1}</td>
                                <td data-label="First Name">{contact.firstName || 'N/A'}</td>
                                <td data-label="Last Name">{contact.lastName || 'N/A'}</td>
                                <td data-label="Email">{contact.email || 'N/A'}</td>
                                <td data-label="Phone">{contact.phone || 'N/A'}</td>
                                <td data-label="Country">{contact.country || 'N/A'}</td>
                                <td data-label="Subject">{contact.subject || 'N/A'}</td>
                                <td data-label="Message">{contact.message || 'N/A'}</td>
                                <td data-label="Submission Date">{contact.submissionDate || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContactData;