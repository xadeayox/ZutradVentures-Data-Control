import { apiFetch } from "../../api";
import type { MaintenanceData } from "./maintenanceTypes";
import { useState } from "react";

interface MaintenanceMessageProps {
    maintenanceLog: MaintenanceData;
    onMarkDone: () => void;
    onDelete: (id: string) => void;
}

export function MaintenanceMessage({ maintenanceLog, onMarkDone, onDelete }: MaintenanceMessageProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function markAsDone() {
        if (maintenanceLog.isDone) return;

        try {
            const response = await apiFetch(
                `/api/maintenance/${maintenanceLog._id}/done`,
                { method: 'PATCH' }
            );

            if (response.ok) {
                onMarkDone();
            }

        } catch (err) {
            console.error('Failed to mark as done:', err);
        }
    }

    async function deleteMaintenance(id: string) {
        if (!window.confirm('Delete this Maintenance?')) return;
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch(`/api/maintenance/${id}`, { method: 'DELETE' });
            const data = await res.json();
            console.log('Response status:', res.status);
            console.log('Response data:', data);
            if (!res.ok) {
                throw new Error(data.message || 'Delete failed.');
            }
            onDelete(id);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Delete failed.');
        }
        setLoading(false);
    }

    return (
        <div className="maintenance-message">
            <h3>Client: {maintenanceLog.client ? maintenanceLog.client.companyName : 'N/A'} — 
                {maintenanceLog.maintenanceDay}</h3>
            <div>
                {maintenanceLog.message}
                <div className="logged-maintenance-metadata">
                    Machine: {maintenanceLog.machine}<br />
                    Date Logged: {new Date(maintenanceLog.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    })} <br />
                    Logged by: {maintenanceLog.user ? `${maintenanceLog.user.firstName} ${maintenanceLog.user.surname}` : 'Deleted User'}
                </div>
            </div>
            <button
                className={!maintenanceLog.isDone ? 'button-mark-as-done-red' : 'button-mark-as-done-green'}
                onClick={markAsDone}
                disabled={maintenanceLog.isDone}
            >
                {!maintenanceLog.isDone ? 'Mark as done' : 'Done ✓'}
            </button>
            <button 
                className="maintenance-message-delete-button"
                onClick={() => deleteMaintenance(maintenanceLog._id)}
                disabled={loading}
            >
                Delete
            </button>
            {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}
        </div>
    );
}
