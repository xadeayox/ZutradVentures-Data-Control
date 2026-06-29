import { ReportMessage } from "./ReportMessage";
import type { ReportData } from './reportTypes';

interface ReportsProps {
    reports: ReportData[];
    userRole: string;
    onStatusChange: () => void;  // re-fetches reports after approve/reject
}

export function ReportMessages({ reports, userRole, onStatusChange }: ReportsProps) {
    return (
        <>
            {reports.map((report) => (
                <ReportMessage
                    report={report}
                    key={report._id}
                    userRole={userRole}
                    onStatusChange={onStatusChange}
                />
            ))}
        </>
    );
}
