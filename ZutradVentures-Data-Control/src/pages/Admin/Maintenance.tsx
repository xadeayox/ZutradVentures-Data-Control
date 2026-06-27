import { Link } from 'react-router';
import { apiFetch } from '../../api';
import { useState, useEffect } from 'react';
import './Maintenance.css';

interface LatestMaintenance {
    id: number;
    message: string;
    machine: string;
    maintenanceDay: string;
    isDone: boolean;
    createdAt: string;
    user: { firstName: string; surname: string };
}

export function Maintenance() {
    const [logs, setLogs] = useState<LatestMaintenance[]>([]);

    useEffect(() => {
        async function fetchLatestMaintenance() {
            try {
                const response = await apiFetch('/api/maintenance/latest');
                const data = await response.json();
                if (response.ok) setLogs(data.logs);
            } catch (err) {
                console.error('Failed to fetch latest maintenance:', err);
            }
        }

        fetchLatestMaintenance();
    }, []);

    return (
        <div className='maintenance-container'>
            <h2 className='maintenance-header'>Latest Maintenance & Intervention</h2>
            <section>
                {logs.length === 0 && (
                    <p style={{ color: 'gray', fontSize: '0.85rem' }}>No maintenance logs yet.</p>
                )}
                {logs.map(log => (
                    <details key={log.id} className='maintenance-details'>
                        <summary className='maintenance-summary'>
                            {log.machine} — {log.maintenanceDay}
                        </summary>
                        {log.message}
                        <div style={{ fontSize: '0.8rem', color: 'gray', marginTop: '4px' }}>
                            By: { log.user ? `${log.user.firstName} ${log.user.surname}` : 'Deleted User'} &nbsp;|&nbsp;
                            Status: {log.isDone ? '✓ Done' : 'Pending'} &nbsp;|&nbsp;
                            {new Date(log.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </div>
                    </details>
                ))}
                <Link to='/maintenance' className='maintenance-link'>See all maintenance & interventions</Link>
            </section>
        </div>
    );
}
