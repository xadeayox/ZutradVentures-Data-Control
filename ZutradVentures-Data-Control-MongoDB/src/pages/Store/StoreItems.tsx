// ─── Shared StoreItems Component ─────────────────────────────────────────────
// All four machine store pages (Macsa, Savema, Sojet, BestCode) do exactly
// the same thing — update quantity and delete items.
// Instead of 4 separate components, we use one shared component.

import { useState } from "react";
import type { StoreData } from "./storeTypes";
import { apiFetch } from "../../api";

interface StoreItemsProps {
    storeItem: StoreData;
    onUpdate: () => void;   // re-fetches after update
    onDelete: () => void;   // re-fetches after delete
}

export function StoreItems({ storeItem, onUpdate, onDelete }: StoreItemsProps) {
    const [toggleUpdate, setToggleUpdate] = useState(false);
    const [quantity, setQuantity] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function saveStoreItem() {
        setLoading(true);
        setError('');

        try {
            const response = await apiFetch(`/api/store/${storeItem._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ quantity })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            setToggleUpdate(false);
            onUpdate();

        } catch (err) {
            setError(`${err}: Could not connect to the server.`);
        }

        setLoading(false);
    }

    async function deleteStoreItem() {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await apiFetch(`/api/store/${storeItem._id}`, {
                method: 'DELETE',
            });

            if (response.ok) onDelete();

        } catch (err) {
            setError(`${err}: Could not connect to the server.`);
        }
    }

    return (
        <div className="store-item-card">
            <h3 className="store-items-header">{storeItem.machinePart}</h3>
            <p className="store-item-details">
                Part Number: {storeItem.partNumber}
                <br />
                Quantity:{' '}
                <span style={{ display: toggleUpdate ? 'none' : 'inline' }}>{storeItem.quantity}</span>
                <input
                    type="number"
                    className="update-store-item-quantity"
                    value={quantity}
                    style={{ display: toggleUpdate ? 'inline' : 'none' }}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <br />
                Date Updated: {new Date(storeItem.updatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                })}
            </p>

            {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

            <div className="store-item-button-container">
                <button
                    className="store-item-button store-item-update-button"
                    onClick={() => setToggleUpdate(prev => !prev)}
                    style={{ backgroundColor: toggleUpdate ? 'rgb(255, 106, 0)' : 'green' }}
                >
                    {toggleUpdate ? 'Cancel' : 'Update'}
                </button>
                <button
                    className="store-item-button store-item-update-button"
                    style={{ display: toggleUpdate ? 'inline' : 'none' }}
                    disabled={quantity === 0 || loading}
                    onClick={saveStoreItem}
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                    className="store-item-button store-item-delete-button"
                    onClick={deleteStoreItem}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
