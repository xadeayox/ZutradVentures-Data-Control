import type { MaintenanceData } from "./maintenanceTypes";
import { MaintenanceMessage } from "./MaintenanceMessage";

interface MaintenanceMessagesProps {
    maintenanceLogs: MaintenanceData[];
    onMarkDone: () => void;     // re-fetches logs after marking as done
    onStatusChange: () => void;
    onDelete: (id: string) => void; 
}

export function MaintenanceMessages({ maintenanceLogs, onMarkDone, onDelete }: MaintenanceMessagesProps) {
    return (
        <>
            {maintenanceLogs.map((log) => (
                <MaintenanceMessage
                    key={log._id}
                    maintenanceLog={log}
                    onMarkDone={onMarkDone}
                    onDelete={onDelete}
                />
            ))}
        </>
    );
}
