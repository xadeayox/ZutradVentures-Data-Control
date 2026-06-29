import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import './Supply.css';
import { apiFetch } from '../../api';

interface LatestSupply {
    id: number;
    goodsSupplied: string;
    partNumber: string;
    quantity: number;
    supplyDate: string;
    createdAt: string;
    client: { companyName: string };
    user: { firstName: string; surname: string };
}

export function Supply() {
    const [supplies, setSupplies] = useState<LatestSupply[]>([]);

    useEffect(() => {
        async function fetchLatestSupply() {
            try {
                const response = await apiFetch('/api/supply/latest');
                const data = await response.json();
                if (response.ok) setSupplies(data.supplies);
            } catch (err) {
                console.error('Failed to fetch latest supply:', err);
            }
        }

        fetchLatestSupply();
    }, []);

    return (
        <div className="supply-container">
            <h2 className="supply-header">Latest Supply to Clients</h2>
            <section>
                {supplies.length === 0 && (
                    <p style={{ color: 'gray', fontSize: '0.85rem' }}>No supply entries yet.</p>
                )}
                {supplies.map(item => (
                    <details key={item.id} className="supply-details">
                        <summary className="supply-summary">
                            {item.goodsSupplied} — {item.client?.companyName ?? 'Unknown Client'}
                        </summary>
                        Part Number: {item.partNumber} <br />
                        Quantity: {item.quantity} <br />
                        Supply Date: {item.supplyDate}
                        <div style={{ fontSize: '0.8rem', color: 'gray', marginTop: '4px' }}>
                            By: { item.user ? `${item.user.firstName} ${item.user.surname}` : 'Deleted User'} &nbsp;|&nbsp;
                            {new Date(item.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </div>
                    </details>
                ))}
                <Link to='/supply' className="supply-link">See all supply</Link>
            </section>
        </div>
    );
}
