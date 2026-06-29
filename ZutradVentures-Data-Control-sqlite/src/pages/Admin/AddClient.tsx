import { useState } from 'react';
import { apiFetch } from '../../api';
import './CreateUser.css';  // reusing the same styles — no new CSS needed
import CheckMarkLogo from '../../assets/images/check-mark.png';
import { Link } from 'react-router';

export function AddClient() {
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleAddClient() {
        setError('');
        setSuccess(false);

        if (!companyName || !address) {
            setError('All fields are required.');
            setTimeout(()=> {
                setError('');
            }, 2000);
            return;
        }

        setLoading(true);

        try {

            const response = await apiFetch('/api/clients', {
                method: 'POST',
                body: JSON.stringify({ companyName, address })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            setCompanyName('');
            setAddress('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            setError('Could not connect to the server.');
        }

        setLoading(false);
    }

    return (
        <div className="create-user-container">
            <h2 className="create-user-header">Add New Client</h2>
            <div>
                <input
                    className="create-user-input"
                    type="text"
                    placeholder="Company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                />
            </div>
            <div>
                <input
                    className="create-user-input"
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
            </div>

            {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

            <div className="button-container-create-user">
                <button
                    className="create-user-button"
                    onClick={handleAddClient}
                    disabled={loading}
                >
                    {loading ? 'Adding...' : 'Add Client'}
                </button>

                {success && (
                    <span className="check-mark-container">
                        <img src={CheckMarkLogo} style={{ width: '20px' }} />
                        <span className="alert-text">Added Successfully</span>
                    </span>
                )}
                <Link to='/admin/clients' className='see-all-link'>See All Clients</Link>
            </div>
        </div>
    );
}
