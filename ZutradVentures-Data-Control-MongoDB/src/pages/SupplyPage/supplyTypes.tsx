// Shared interfaces for the supply module

export interface SupplyData {
    id: number;
    goodsSupplied: string;
    partNumber: string;
    quantity: number;
    supplyDate: string;
    createdAt: string;
    client: { id: number; companyName: string };
    user: { id: number; firstName: string; surname: string };
}
