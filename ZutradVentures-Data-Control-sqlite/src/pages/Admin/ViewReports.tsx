import './ViewReports.css';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';

interface LatestReport {
    id: number;
    reportDetails: string;
    lineNumber: number;
    status: string;
    createdAt: string;
    client: { companyName: string };
    user: { firstName: string; surname: string };
}

export function ViewReports() {
    const [reports, setReports] = useState<LatestReport[]>([]);

    useEffect(() => {
        async function fetchLatestReports() {
            try {
                const response = await apiFetch('/api/reports/latest');
                const data = await response.json();
                if (response.ok) setReports(data.reports);
            } catch (err) {
                console.error('Failed to fetch latest reports:', err);
            }
        }

        fetchLatestReports();
    }, []);

    return (
        <div className="view-reports-container">
            <h2 className="view-reports-header">Latest Reports</h2>
            <section>
                {reports.length === 0 && (
                    <p style={{ color: 'gray', fontSize: '0.85rem' }}>No reports yet.</p>
                )}
                {reports.map(report => (
                    <details key={report.id} className="report-details">
                        <summary className="report-summary">
                            {report.client?.companyName ?? 'Unknown Client'} — Line {report.lineNumber}
                        </summary>
                        {report.reportDetails}
                        <div style={{ fontSize: '0.8rem', color: 'gray', marginTop: '4px' }}>
                            By: { report.user ? `${report.user.firstName} ${report.user.surname}` : 'Deleted User'} &nbsp;|&nbsp;
                            Status: {report.status} &nbsp;|&nbsp;
                            {new Date(report.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </div>
                    </details>
                ))}
                <Link to='/reports' className='view-reports-link'>See all Reports</Link>
            </section>
        </div>
    );
}
