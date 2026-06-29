// Shared interfaces for the store module
// All store components import from here

export interface StoreData {
    id: number;
    serialNumber: string;
    partNumber: string;
    machinePart: string;
    machine: string;
    quantity: number;
    updatedAt: string;
}
