// Shared interfaces for the supply module

export interface SupplyData {
    _id: number;
    goodsSupplied: string;
    partNumber: string;
    quantity: number;
    supplyDate: string;
    createdAt: string;
    client: { _id: string; companyName: string };
    user: { _id: string; firstName: string; surname: string };
}
