// What a report looks like coming from the database
export interface ReportData {
    id: number;
    reportDetails: string;
    lineNumber: number;
    imagePaths: string[];
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    client: { id: number; companyName: string };
    user: { id: number; firstName: string; surname: string };
}