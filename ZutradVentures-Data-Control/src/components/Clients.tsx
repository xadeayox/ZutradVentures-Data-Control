import { Link } from "react-router";
import FactoryLogo from '../assets/images/factory-icon.png';
import './Clients.css';

// Everyone can see the clients page so no permission check needed here
export function Clients() {
    return (
        <nav className="client-machines-logo-container">
            <Link to="/clients">
                <img src={FactoryLogo} title="client-machines" className='client-machines-icon' />
            </Link>
        </nav>
    );
}
