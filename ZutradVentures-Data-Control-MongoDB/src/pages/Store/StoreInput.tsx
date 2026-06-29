import { useState } from "react";
import CheckMarkLogo from '../../assets/images/check-mark.png';
import { apiFetch } from "../../api";

interface StoreInputProps {
    toggleInput: boolean;
    onItemAdded: () => void;    // re-fetches store after adding an item
}

export function StoreInput({ toggleInput, onItemAdded }: StoreInputProps) {
    const [serialNumber, setSerialNumber] = useState('');
    const [partNumber, setPartNumber] = useState('');
    const [machinePart, setMachinePart] = useState('');
    const [machine, setMachine] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [alertMessage, setAlertMessage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function saveToStore() {
        setError('');
        setLoading(true);

        try {
            const response = await apiFetch('/api/store', {
                method: 'POST',
                body: JSON.stringify({ serialNumber, partNumber, machinePart, machine, quantity })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            setSerialNumber('');
            setPartNumber('');
            setMachinePart('');
            setMachine('');
            setQuantity(0);

            setAlertMessage(true);
            setTimeout(() => setAlertMessage(false), 2000);

            onItemAdded();  // re-fetch store to show the new item

        } catch (err) {
            setError(`${err}: Could not connect to the server.`);
        }

        setLoading(false);
    }

    return (
        <fieldset className="store-input-container" style={{ display: toggleInput ? 'flex' : 'none' }}>
            <legend>Store New Items</legend>
            <input
                type="text"
                placeholder="serial number"
                className="store-input-component store-input-serial-number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
            />
            <input
                type="text"
                placeholder="part number"
                className="store-input-component store-input-serial-number"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
            />
            <input
                type="text"
                placeholder="name of machine or part"
                className="store-input-component store-input-name"
                value={machinePart}
                onChange={(e) => setMachinePart(e.target.value)}
            />
            <label htmlFor="machine">For Coder: </label>
            <select
                title="selection"
                name="machine"
                className="select-machine-store-input store-input-component"
                value={machine}
                onChange={(e) => setMachine(e.target.value)}
            >
                <option disabled value="">Select Machine</option>
                <option value="Macsa ID">Macsa ID</option>
                <option value="Savema">Savema</option>
                <option value="Sojet">Sojet</option>
                <option value="BestCode">BestCode</option>
            </select>
            <label htmlFor="quantity">Quantity: </label>
            <input
                type="number"
                step="1"
                min="1"
                className="store-quantity-input store-input-component"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
            />

            {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

            <button
                className="store-input-component save-store-input-button"
                disabled={!serialNumber || !partNumber || !machinePart || !machine || !quantity || loading}
                onClick={saveToStore}
            >
                {loading ? 'Saving...' : 'Save'}
            </button>
            <span className="check-mark-container" style={{ display: alertMessage ? 'inline' : 'none' }}>
                <img src={CheckMarkLogo} style={{ width: '20px' }} />
                <span className="alert-text">Created Successfully</span>
            </span>
        </fieldset>
    );
}
