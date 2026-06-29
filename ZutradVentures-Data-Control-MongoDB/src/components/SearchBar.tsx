import searchLogo from '../assets/images/search-icon.png';
import logoutLogo from '../assets/images/logout-icon.png';
import { useNavigate } from 'react-router';
import './SearchBar.css';

interface searchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}

export function SearchBar({searchTerm, setSearchTerm}: searchTermProps) {
    const navigate = useNavigate();

    // Read the logged in user from localStorage
    // This was saved during login in LoginPage.tsx:
    // localStorage.setItem('user', JSON.stringify(data.user))
    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    function logoutUser() {
         localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    }

    return (
        <div className="search-bar-container">
            <h3 className="welcome-message">
                Hello {currentUser ? `${currentUser.firstName} ${currentUser.surname}` : 'Guest'}
            </h3>

            <div className="search-input-wrapper">
                <input
                    type="text"
                    placeholder="search..."
                    className="search-text-box"
                    value={searchTerm}
                    onChange={(event)=> {
                        setSearchTerm(event.target.value);
                    }}
                />
                <img
                    src={searchLogo}
                    className="search-logo"
                    alt="Search"
                />
            </div>
         
            <img 
                src={logoutLogo}
                className="logout-logo"
                title="Logout"
                onClick={logoutUser}
            />
            
        </div>
    );
}
