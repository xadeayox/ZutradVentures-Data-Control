import { apiFetch } from "../../api";
import type { MaintenanceData } from "./maintenanceTypes";

interface MaintenanceMessageProps {
    maintenanceLog: MaintenanceData;
    onMarkDone: () => void;
}

export function MaintenanceMessage({ maintenanceLog, onMarkDone }: MaintenanceMessageProps) {

    async function markAsDone() {
        if (maintenanceLog.isDone) return;

        try {
            const response = await apiFetch(
                `/api/maintenance/${maintenanceLog.id}/done`,
                { method: 'PATCH' }
            );

            if (response.ok) {
                onMarkDone();
            }

        } catch (err) {
            console.error('Failed to mark as done:', err);
        }
    }

    return (
        <div className="maintenance-message">
            <h3>{maintenanceLog.maintenanceDay} — {maintenanceLog.machine}</h3>
            <div>
                {maintenanceLog.message}
                <div className="logged-maintenance-metadata">
                    Client: {maintenanceLog.client ? maintenanceLog.client.companyName : 'N/A'} <br />
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
        </div>
    );
}
