import { Link } from 'react-router';
import AdministratorLogo from '../assets/images/administrator-icon.png';
import './Administrator.css';
import { usePermissions } from '../hooks/usePermissions';

export function Administrator() {
    const { canViewAdmin } = usePermissions();

    // Only render the link if the user is an administrator
    if (!canViewAdmin) return null;

    return (
        <>
            <nav className="admin-logo-container">
                <Link to="/admin">
                    <img src={AdministratorLogo} title="administrator" className='admin-icon' />
                </Link>
            </nav>
        </>
    );
}
