import { useState } from 'react';
import { apiFetch } from '../../api';
import './CreateUser.css';
import CheckMarkLogo from '../../assets/images/check-mark.png';
import { Link } from 'react-router';

export function CreateUser() {
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleCreateUser() {
        setError('');
        setSuccess(false);

        // Basic validation
        if (!firstName || !surname || !email || !role) {
            setError('All fields are required.');
            setTimeout(()=> {
                setError('');
            }, 2000)
            
            return;
        }

        setLoading(true);

        try {
            // Get the admin's token from localStorage so the backend knows who is making this request

            const response = await apiFetch('/api/users', {
                method: 'POST',
                body: JSON.stringify({ firstName, surname, email, role })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            // Clear the form and show the checkmark
            setFirstName('');
            setSurname('');
            setEmail('');
            setRole('');
            setSuccess(true);

            // Hide the checkmark after 3 seconds
            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            setError('Could not connect to the server.');
        }

        setLoading(false);
    }

    return (
        <div className="create-user-container">
            <h2 className="create-user-header">Create New User</h2>
            <div>
                <input
                    className="create-user-input"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
            </div>
            <div>
                <input
                    className="create-user-input"
                    type="text"
                    placeholder="Surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                />
            </div>
            <div>
                <input
                    className="create-user-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div>
                <select
                    title="selection"
                    className="create-user-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="" disabled hidden>Role</option>
                    <option value="engineer">Engineer</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="administrator">Admin</option>
                </select>
            </div>

            {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

            <div className="button-container-create-user">
                <button
                    className="create-user-button"
                    onClick={handleCreateUser}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create User'}
                </button>
                {/* Checkmark only shows after a successful creation */}
                {success && (
                    <span className="check-mark-container">
                        <img src={CheckMarkLogo} style={{ width: '20px' }} />
                        <span className="alert-text">Created Successfully</span>
                    </span>
                )}
                <Link to='/admin/users' className='see-all-link'>See All Users</Link>
            </div>
        </div>
    );
}
