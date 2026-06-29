import { Link } from 'react-router';
import storeLogo from '../assets/images/carton-box.png';
import './Store.css';
import { usePermissions } from '../hooks/usePermissions';

export function Store() {
    const { canViewStore } = usePermissions();

    if (!canViewStore) return null;

    return (
        <>
            <nav className="store-logo-container">
                <Link to="/store">
                    <img src={storeLogo} className='store-icon' title='store' />
                </Link>
            </nav>
        </>
    );
}
