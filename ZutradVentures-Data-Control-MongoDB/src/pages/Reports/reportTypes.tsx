// What a report looks like coming from the database
export interface ReportData {
    _id: string;
    reportDetails: string;
    lineNumber: number;
    imagePaths: string[];
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    client: { _id: string; companyName: string };
    user: { _id: string; firstName: string; surname: string };
}