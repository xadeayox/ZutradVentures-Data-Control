import { useState } from 'react';
import type { ReportData } from './reportTypes';
import { apiFetch } from '../../api';

interface ReportMessageProps {
    report: ReportData;
    userRole: string;
    onStatusChange: () => void;
}

const imageURL = 'http://localhost:5000/';
// http://localhost:5000/
// http://zutrad-ventures-data-control-env.eba-kpm7wuuy.eu-north-1.elasticbeanstalk.com/

export function ReportMessage({ report, userRole, onStatusChange }: ReportMessageProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isAdmin = userRole === 'administrator';

    async function updateStatus(status: 'approved' | 'rejected') {
        setLoading(true);
        setError('');
        try {
            const response = await apiFetch(`/api/reports/${report._id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }
            onStatusChange();
        } catch (err) {
            setError(`${err}: Could not connect to the server.`);
        }
        setLoading(false);
    }

    async function deleteReport(id: string) {
        if (!window.confirm('Delete this Report?')) return;
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch(`/api/reports/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Delete failed.');
            }
            onStatusChange();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Delete failed.');
        }
        setLoading(false);
    }

    return (
        <>
            <div className="report-message">
                <h3 className="report-message-header">
                    {report.client?.companyName ?? 'Unknown Client'} — Line: {report.lineNumber}
                </h3>
                <p className="report-details">{report.reportDetails}</p>

                <div className="report-images">
                    {report.imagePaths?.map((filePath, index) => (
                        <img
                            className="images-report-message"
                            key={index}
                            src={`${imageURL}${filePath}`}
                            alt={`Report file ${index}`}
                            onClick={() => {setSelectedImage(`${imageURL}${filePath}`); console.log(report.imagePaths)}}
                        />
                    ))}
                </div>

                {selectedImage && (
                    <div className="image-modal" onClick={() => setSelectedImage(null)}>
                        <img src={selectedImage} alt="Selected" style={{ maxWidth: '90%', maxHeight: '90%' }} />
                    </div>
                )}

                <div className="report-metadata">
                    Date Posted: {new Date(report.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                    })} <br />
                    Written By: {report.user ? `${report.user.firstName} ${report.user.surname}` : 'Deleted User'}
                </div>

                {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

                <button
                    className="report-button report-button-approve"
                    style={{ display: report.status === 'rejected' ? 'none' : 'inline-block' }}
                    onClick={() => updateStatus('approved')}
                    disabled={!isAdmin || report.status === 'approved' || loading}
                >
                    {report.status === 'approved' ? 'Approved ✓' : 'Approve'}
                </button>

                <button
                    className="report-button report-button-reject"
                    style={{ display: report.status === 'approved' ? 'none' : 'inline-block' }}
                    onClick={() => updateStatus('rejected')}
                    disabled={!isAdmin || report.status === 'rejected' || loading}
                >
                    {report.status === 'rejected' ? 'Rejected ✗' : 'Reject'}
                </button>

                <button
                    className="report-button report-button-delete"
                    onClick={() => deleteReport(report._id)}
                    disabled={loading}
                >
                    Delete Report
                </button>
            </div>
        </>
    );
}