import type { MaintenanceData } from "./maintenanceTypes";
import { MaintenanceMessage } from "./MaintenanceMessage";

interface MaintenanceMessagesProps {
    maintenanceLogs: MaintenanceData[];
    onMarkDone: () => void;     // re-fetches logs after marking as done
}

export function MaintenanceMessages({ maintenanceLogs, onMarkDone }: MaintenanceMessagesProps) {
    return (
        <>
            {maintenanceLogs.map((log) => (
                <MaintenanceMessage
                    key={log.id}
                    maintenanceLog={log}
                    onMarkDone={onMarkDone}
                />
            ))}
        </>
    );
}
