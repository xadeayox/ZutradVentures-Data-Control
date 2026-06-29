// Shared interfaces for the maintenance module
// MaintenancePage, MaintenanceMessages and MaintenanceMessage all import from here

export interface MaintenanceData {
    _id: string;
    message: string;
    machine: string;
    maintenanceDay: string;
    isDone: boolean;
    createdAt: string;
    user: { _id: string; firstName: string; surname: string } | null;
    client: { _id: string; companyName: string } | null;
}
