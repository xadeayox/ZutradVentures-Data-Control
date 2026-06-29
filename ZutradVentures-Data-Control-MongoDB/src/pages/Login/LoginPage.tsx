import './LoginPage.css';
import hideIcon from '../../assets/images/hide-password-icon.png';
import viewIcon from '../../assets/images/view-password-icon.png';
import { useNavigate, Link } from 'react-router';
import { Footer } from '../../components/Footer';
import { useState } from 'react';
import { apiFetch } from '../../api';

export default function LoginPage() {
    const [isHidden, setIsHidden] = useState(false);
    const [inputType, setInputType] = useState('password');

    // These store what the user types into the email and password fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // This shows error messages to the user (e.g. "Invalid credentials")
    const [error, setError] = useState('');

    // This disables the button while the request is being processed
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function verifyUser() {
        // Clear any previous error
        setError('');

        // Basic front-end validation before even hitting the backend
        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setLoading(true);

        try {
            // Send the email and password to the backend login endpoint
            const response = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Backend returned an error (e.g. wrong password, user not found)
                setError(data.message);
                setLoading(false);
                return;
            }

            // ── Login successful ──────────────────────────────────────────────
            // Save the token in localStorage so it can be sent with future requests
            // Think of this like the app "remembering" who is logged in
            localStorage.setItem('token', data.token);

            // Also save basic user info so any page can access it without re-fetching
            localStorage.setItem('user', JSON.stringify(data.user));

            // If it's their first time logging in, send them to reset their password
            if (data.user.isFirstLogin) {
                navigate('/passwordreset');
                return;
            }

            // Route each role to their own dashboard
            if (data.user.role === 'administrator') {
                navigate('/admin');
            } else if (data.user.role === 'engineer') {
                navigate('/clients');
            } else if (data.user.role === 'receptionist') {
                navigate('/clients');
            }

        } catch (err) {
            // This catches network errors (e.g. backend is not running)
            setError('Could not connect to the server. Please try again.');
        }

        setLoading(false);
    }

    function toggleIcon() {
        if(isHidden) {
            setIsHidden(false);
            setInputType('password');
        } else {
            setIsHidden(true);
            setInputType('text');
        }
    }

    return(
        <div className="login-container">
            <div className="login-sub-container">
                <header className="login-header">
                    <h1>Login</h1>
                </header>
                <section className="login-form-container">
                    <div className="login-form">
                        <div className="input-container">
                            <input
                                className="input-box"
                                type="email"
                                placeholder="email"
                                autoComplete="on"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="password-input-container input-container">
                            <input
                                className="input-box"
                                type={inputType}
                                placeholder="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <img
                                className="toggle-password-icon"
                                src={isHidden ? viewIcon : hideIcon}
                                onClick={toggleIcon}
                            />
                        </div>

                        {/* Show error message if something went wrong */}
                        {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

                        <div>
                            <button
                                className="login-button"
                                onClick={verifyUser}
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                            <Link to="/passwordreset" className="forgot-password-link">Forgot Password</Link>
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
}
