import { Link } from "react-router";
import './MainStoreNavLink.css';

export function MainStoreNavLink() {
    return(
        <>
            <Link to="/store" className="back-to-main-store-link">Back to Main Store</Link>
        </>
    );
}