import { NavLink } from "react-router";
import { useState } from "react";
import './HamBurgerLinks.css';

export function HamBurgerLinks() {
    const [open, setOpen] = useState(false);

    function toggleHamburger() {
        if(open) {
            setOpen(false);
        }
        else {
            setOpen(true);
        }
    }

    return(
        <div className="hamburger-links-container">
            <button 
                className="hamburger-button"
                onClick={toggleHamburger}
            >
                {open ? 'X' : '☰'}
            </button>
            {open && (
                <div className="menu-links">
                    <NavLink to='/invoices' className="menu-link">Invoices</NavLink>
                    <NavLink to='/quotations' className="menu-link">Quotation</NavLink>
                    <NavLink to='/grns' className="menu-link">GRNs</NavLink>
                    <NavLink to='/purchaseorders' className="menu-link">Purchase Orders</NavLink>
                </div>
            )}
        </div>
    )
}