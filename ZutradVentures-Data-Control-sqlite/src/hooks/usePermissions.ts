// ─── usePermissions Hook ──────────────────────────────────────────────────────
// This hook reads the logged-in user's role and special permissions
// from localStorage and returns a simple object of what they can access.
//
// It's used by:
// 1. Nav components — to show/hide links
// 2. ProtectedRoute — to block direct URL access
//
// We also fetch special permissions from the backend because they are stored
// in the database (not in the JWT token).

import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

interface Permissions {
    isAdmin: boolean;
    canViewAdmin: boolean;
    canViewClients: boolean;
    canViewReports: boolean;
    canViewMaintenance: boolean;
    canViewSupply: boolean;
    canViewStore: boolean;
    canViewInvoices: boolean;
    role: string;
    loaded: boolean;    // lets components wait before rendering
}

export function usePermissions(): Permissions {
    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const role = currentUser?.role || '';

    const [specialPages, setSpecialPages] = useState<string[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function fetchPermissions() {
            // Admins don't need special permissions — they have full access
            if (role === 'administrator') {
                setLoaded(true);
                return;
            }

            try {
                const response = await apiFetch('/api/users/my-permissions');
                const data = await response.json();
                if (response.ok) {
                    // data.permissions is an array like ['store', 'maintenance']
                    setSpecialPages(data.permissions.map((p: { page: string }) => p.page));
                }
            } catch (err) {
                console.error('Failed to fetch permissions:', err);
            }

            setLoaded(true);
        }

        fetchPermissions();
    }, [role]);

    const isAdmin = role === 'administrator';
    const isEngineer = role === 'engineer';
    const isReceptionist = role === 'receptionist';

    return {
        isAdmin,
        role,
        loaded,
        canViewAdmin: isAdmin,
        canViewClients: true,       // everyone can see clients
        canViewReports: true,       // everyone can see reports
        canViewMaintenance: isAdmin || isEngineer || specialPages.includes('maintenance'),
        canViewSupply: isAdmin || isReceptionist || specialPages.includes('supply'),
        canViewStore: isAdmin || specialPages.includes('store'),
        canViewInvoices: isAdmin || isReceptionist,  // engineers cannot access invoices
    };
}
