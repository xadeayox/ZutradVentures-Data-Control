export class ClientMachine {
    serialNumber: string;
    factoryInstalled: string;
    machine: string;
    installedDate: string;
    maintenanceCycle: number;
    lastMaintenanceDate: string;
    lineInstalled: number;
    usageStatus: string;
    keywords: string[];

    constructor(data: {
    serialNumber: string;
    factoryInstalled: string;
    machine: string;
    installedDate: string;
    maintenanceCycle: number;
    lastMaintenanceDate: string;
    lineInstalled: number;
    usageStatus: string;
    }) {
    this.serialNumber = data.serialNumber;
    this.factoryInstalled = data.factoryInstalled;
    this.machine = data.machine;
    this.installedDate = data.installedDate;
    this.maintenanceCycle = data.maintenanceCycle;
    this.lastMaintenanceDate = data.lastMaintenanceDate;
    this.lineInstalled = data.lineInstalled;
    this.usageStatus = data.usageStatus;
    this.keywords = [this.serialNumber, this.machine, this.factoryInstalled];
    }
}