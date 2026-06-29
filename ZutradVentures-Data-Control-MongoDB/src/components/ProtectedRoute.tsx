import { Navigate } from 'react-router';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
    page: 'admin' | 'clients' | 'reports' | 'maintenance' | 'supply' | 'store' | 'invoices';
    children: React.ReactNode;
}

// ─── What is a ProtectedRoute? ────────────────────────────────────────────────
// Even if we hide nav links, a user could still type /store directly in the
// browser and access it. ProtectedRoute prevents that.
//
// Wrap any route with this component in your router:
//   <Route path="/store" element={<ProtectedRoute page="store"><StorePage /></ProtectedRoute>} />
//
// If the user doesn't have access, they get redirected to /client-machines
// (the page everyone is allowed to see).

export function ProtectedRoute({ page, children }: ProtectedRouteProps) {
    const permissions = usePermissions();

    // Wait until permissions are loaded before making a decision
    // This prevents a brief flash of the wrong page
    if (!permissions.loaded) return null;

    const allowed = {
        admin: permissions.canViewAdmin,
        clients: permissions.canViewClients,
        reports: permissions.canViewReports,
        maintenance: permissions.canViewMaintenance,
        supply: permissions.canViewSupply,
        store: permissions.canViewStore,
        invoices: permissions.canViewInvoices,
    };

    if (!allowed[page]) {
        // Redirect unauthorized users to the clients page
        return <Navigate to="/clients" replace />;
    }

    return <>{children}</>;
}
