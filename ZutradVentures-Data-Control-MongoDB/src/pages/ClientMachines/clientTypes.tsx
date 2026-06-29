// Shared interfaces for the clients module
// Both ClientMachinesPage, ClientMachines and ClientMachinesInput import from here

export interface MachineData {
    id: number;
    serialNumber: string;
    machine: string;
    lineInstalled: number;
    installedDate: string;
    maintenanceCycle: number;
    lastMaintenanceDate: string;
    usageStatus: string;
    clientId: number;
}

export interface ClientData {
    id: number;
    companyName: string;
    address: string;
    machines: MachineData[];
}