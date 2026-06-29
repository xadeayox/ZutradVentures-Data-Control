import { Link } from 'react-router';
import ReportsLogo from '../assets/images/report-icon.png';
import './Reports.css';

// Everyone can see the reports page so no permission check needed here
export function Reports() {
    return (
        <>
            <nav className="reports-logo-container">
                <Link to="/reports">
                    <img src={ReportsLogo} title="reports" className='reports-icon' />
                </Link>
            </nav>
        </>
    );
}
