// Shared interfaces for the clients module
// Both ClientMachinesPage, ClientMachines and ClientMachinesInput import from here

export interface MachineData {
    _id: string;
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
    _id: string;
    companyName: string;
    address: string;
    machines: MachineData[];
}