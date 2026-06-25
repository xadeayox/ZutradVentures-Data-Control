import { Link } from 'react-router';
import MaintenanceLogo from '../assets/images/maintenance-icon.png';
import './Maintenance.css';
import { usePermissions } from '../hooks/usePermissions';

export function Maintenance() {
    const { canViewMaintenance } = usePermissions();

    if (!canViewMaintenance) return null;

    return (
        <>
            <nav className="maintenance-logo-container">
                <Link to="/maintenance">
                    <img src={MaintenanceLogo} title="maintenance" className='maintenance-icon' />
                </Link>
            </nav>
        </>
    );
}
