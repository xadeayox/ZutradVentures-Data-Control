import { useState } from 'react';
import type { ReportData } from './reportTypes';
import { apiFetch } from '../../api';

interface ReportMessageProps {
    report: ReportData;
    userRole: string;           // used to disable approve/reject for non-admins
    onStatusChange: () => void; // re-fetches reports after status update
}

export function ReportMessage({ report, userRole, onStatusChange }: ReportMessageProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const imageURL = 'http://localhost:5000';
    // replace with: http://zutrad-ventures-data-control-env.eba-kpm7wuuy.eu-north-1.elasticbeanstalk.com

    const isAdmin = userRole === 'administrator';

    async function updateStatus(status: 'approved' | 'rejected') {
        setLoading(true);
        setError('');

        try {
            const response = await apiFetch(`/api/reports/${report.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            onStatusChange();   // re-fetch all reports to reflect the updated status

        } catch (err) {
            setError('Could not connect to the server.');
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

                {/* Display uploaded images — fetched from the server using the stored path */}
                <div className="report-images">
                    {report.imagePaths?.map((filePath, index) => (
                        <img
                            className="images-report-message"
                            key={index}
                            src={`${imageURL}${filePath}`}
                            alt={`Report file ${index}`}
                            onClick={() => setSelectedImage(`${imageURL}${filePath}`)}
                        />
                    ))}
                </div>

                {/* Fullscreen image modal on click */}
                {selectedImage && (
                    <div className="image-modal" onClick={() => setSelectedImage(null)}>
                        <img src={selectedImage} alt="Selected" style={{ maxWidth: '90%', maxHeight: '90%' }} />
                    </div>
                )}

                <div className="report-metadata">
                    Date Posted: {new Date(report.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    })} <br />
                    Written By: By: {report.user ? `${report.user.firstName} ${report.user.surname}` : 'Deleted User'}
                </div>

                {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

                {/* Approve button — disabled for non-admins and if already rejected */}
                <button
                    className="report-button report-button-approve"
                    style={{ display: report.status === 'rejected' ? 'none' : 'inline-block' }}
                    onClick={() => updateStatus('approved')}
                    disabled={!isAdmin || report.status === 'approved' || loading}
                >
                    {report.status === 'approved' ? 'Approved ✓' : 'Approve'}
                </button>

                {/* Reject button — disabled for non-admins and if already approved */}
                <button
                    className="report-button report-button-reject"
                    style={{ display: report.status === 'approved' ? 'none' : 'inline-block' }}
                    onClick={() => updateStatus('rejected')}
                    disabled={!isAdmin || report.status === 'rejected' || loading}
                >
                    {report.status === 'rejected' ? 'Rejected ✗' : 'Reject'}
                </button>
            </div>
        </>
    );
}
