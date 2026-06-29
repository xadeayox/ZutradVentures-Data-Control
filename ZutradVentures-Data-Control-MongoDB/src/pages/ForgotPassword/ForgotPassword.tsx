import './ForgotPassword.css';
import hideIcon from '../../assets/images/hide-password-icon.png';
import viewIcon from '../../assets/images/view-password-icon.png';
import { useNavigate, Link } from 'react-router';
import { Footer } from '../../components/Footer';
import { useState } from 'react';
import { apiFetch } from '../../api';

export default function ForgotPassword() {
    const [isHidden, setIsHidden] = useState(false);
    const [isHiddenr, setIsHiddenr] = useState(false);
    const [inputType, setInputType] = useState('password');
    const [inputTyper, setInputTyper] = useState('password');

    // These store what the user types into each field
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [retypePassword, setRetypePassword] = useState('');

    // For showing error or success messages
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Disables the button while the request is processing
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function resetPassword() {
        setError('');
        setSuccess('');

        // Front-end validation before hitting the backend
        if (!email || !newPassword || !retypePassword) {
            setError('All fields are required.');
            return;
        }

        if (newPassword !== retypePassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            // Send the reset request to the backend
            const response = await apiFetch('/api/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ email, newPassword, retypePassword })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            // ── Reset successful ──────────────────────────────────────────────
            // Show a success message briefly, then redirect to login
            setSuccess('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/'), 2000); // wait 2 seconds then go to login

        } catch (err) {
            // Network error — backend probably not running
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

    function toggleIconr() {
        if(isHiddenr) {
            setIsHiddenr(false);
            setInputTyper('password');
        } else {
            setIsHiddenr(true);
            setInputTyper('text');
        }
    }

    return(
        <div className="forgot-password-container">
            <div className="forgot-password-sub-container">
                <header className="forgot-password-header">
                    <h1>Forgot Password</h1>
                </header>
                <section className="forgot-password-form-container">
                    <div className="forgot-password-form">
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
                                placeholder=" new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <img
                                className="toggle-password-icon"
                                src={isHidden ? viewIcon : hideIcon}
                                onClick={toggleIcon}
                            />
                        </div>
                        <div className="password-input-container input-container">
                            <input
                                className="input-box"
                                type={inputTyper}
                                placeholder=" retype new password"
                                value={retypePassword}
                                onChange={(e) => setRetypePassword(e.target.value)}
                            />
                            <img
                                className="toggle-password-icon"
                                src={isHiddenr ? viewIcon : hideIcon}
                                onClick={toggleIconr}
                            />
                        </div>

                        {/* Show error or success messages */}
                        {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}
                        {success && <p style={{ color: 'green', fontSize: '0.85rem' }}>{success}</p>}

                        <div>
                            <button
                                className="forgot-password-button"
                                onClick={resetPassword}
                                disabled={loading}
                            >
                                {loading ? 'Resetting...' : 'Reset'}
                            </button>
                            <Link to="/" className="forgot-password-link">Sign in</Link>
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
}
