import { Footer } from '../../components/Footer';
import { Link } from 'react-router';
import './NotFound.css';

export default function NotFoundPage() {
    return (
        <div className="not-found-container">
            <title>Not Found</title>
            <h1 className='error-code'>
                404
            </h1>
            <p className="error-message">Sorry the page you are looking for does not exist.</p>
            <Link to='/login' className="back-to-login-link">Back to Login</Link>
            <Footer />
        </div>
    );
}