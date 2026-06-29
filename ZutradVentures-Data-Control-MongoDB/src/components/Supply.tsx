import { Link } from 'react-router';
import SupplyLogo from '../assets/images/supply-icon.png';
import './Supply.css';
import { usePermissions } from '../hooks/usePermissions';

export function Supply() {
    const { canViewSupply } = usePermissions();

    if (!canViewSupply) return null;

    return (
        <>
            <nav className="supply-logo-container">
                <Link to="/supply">
                    <img src={SupplyLogo} title="supply" className='supply-icon' />
                </Link>
            </nav>
        </>
    );
}
