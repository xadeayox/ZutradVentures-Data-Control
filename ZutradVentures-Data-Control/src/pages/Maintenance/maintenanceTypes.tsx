// Shared interfaces for the maintenance module
// MaintenancePage, MaintenanceMessages and MaintenanceMessage all import from here

export interface MaintenanceData {
    id: number;
    message: string;
    machine: string;
    maintenanceDay: string;
    isDone: boolean;
    createdAt: string;
    user: { id: number; firstName: string; surname: string } | null;
    client: { id: number; companyName: string } | null;
}
