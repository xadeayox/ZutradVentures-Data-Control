import CheckMarkLogo from '../../assets/images/check-mark.png';
import { useState } from 'react';
import type { ClientData } from './clientTypes';
import { apiFetch } from '../../api';

interface ClientMachineInputProps {
    displayInput: boolean;
    clients: ClientData[];          // real clients from the database for the dropdown
    onMachineAdded: () => void;     // re-fetches the list after a machine is added
}

export function ClientMachinesInput({ displayInput, clients, onMachineAdded }: ClientMachineInputProps) {
    const [alertMessage, setAlertMessage] = useState(false);
    const [serialNumber, setSerialNumber] = useState('');
    const [clientId, setClientId] = useState('');
    const [lineInstalled, setLineInstalled] = useState(0);
    const [machine, setMachine] = useState('');
    const [installedDate, setInstalledDate] = useState('');
    const [maintenanceCycle, setMaintenanceCycle] = useState(0);
    const [usageStatus, setUsageStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function saveMachine() {
        setError('');

        if (!serialNumber || !clientId || !lineInstalled || !machine ||
            !installedDate || !maintenanceCycle || !usageStatus) {
            setError('All fields are required.');
            return;
        }

        setLoading(true);

        try {
            console.log('clientId state:', clientId);
            const response = await apiFetch('/api/clients/machines', {
                method: 'POST',
                body: JSON.stringify({
                    serialNumber,
                    clientName: clients.find(c => c._id === clientId)?.companyName ?? '',
                    lineInstalled,
                    clientId,
                    machine,
                    installedDate,
                    maintenanceCycle,
                    usageStatus
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            // Clear the form
            setSerialNumber('');
            setClientId('');
            setLineInstalled(0);
            setMachine('');
            setInstalledDate('');
            setMaintenanceCycle(0);
            setUsageStatus('');

            // Show checkmark briefly
            setAlertMessage(true);
            setTimeout(() => setAlertMessage(false), 2000);

            // Tell the parent page to re-fetch the updated list
            onMachineAdded();

        } catch (err) {
            setError(`${err} Could not connect to the server.`);
        }

        setLoading(false);
    }
    return (
        <fieldset className="client-machine-input-container" style={{ display: displayInput ? 'flex' : 'none' }}>
            <legend className="register-machine-input-header">
                Register a New Machine Installed for Our Clients
            </legend>

            <input
                type="text"
                placeholder='Serial Number'
                className="client-machine-serial client-machine-input"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
            />

            {/* Client dropdown — dynamically loaded from the database */}
            <span>
                Client:
                <select
                    title="selection"
                    className="client-machine-input"
                    value={clientId}
                    onInput={(e) => {
    const target = e.target as HTMLSelectElement;
    console.log('onInput value:', target.value);
    setClientId(target.value);
}}
                >
                    <option value="" disabled>Select Client</option>
                    {clients.map(client => {
                        return (
                        <option key={client._id} value={String(client._id)}>
                            {client.companyName}
                        </option>
                      )} 
                    )}
                </select>
            </span>

            <span>
                Line Installed:
                <input
                    type="number"
                    className="client-machine-input client-machine-input-factory-line"
                    value={lineInstalled}
                    onChange={(e) => setLineInstalled(Number(e.target.value))}
                />
            </span>

            <span>
                Machine:
                <select
                    title="selection"
                    className="client-machine-select-machine client-machine-input"
                    value={machine}
                    onChange={(e) => setMachine(e.target.value)}
                >
                    <option disabled value="">Select Machine</option>
                    <option value="Macsa ID">Macsa ID</option>
                    <option value="Savema">Savema</option>
                    <option value="Sojet">Sojet</option>
                    <option value="BestCode">BestCode</option>
                </select>
            </span>

            <span>
                Installed Date:
                <input
                    type="date"
                    className="client-machine-input"
                    value={installedDate}
                    onChange={(e) => setInstalledDate(e.target.value)}
                />
            </span>

            <span>
                Maintenance Cycle:
                <select
                    title="selection"
                    className="client-machine-input"
                    value={maintenanceCycle}
                    onChange={(e) => setMaintenanceCycle(Number(e.target.value))}
                >
                    <option value="0" disabled>Select Cycle</option>
                    <option value="3">3 Months</option>
                    <option value="4">4 Months</option>
                    <option value="6">6 Months</option>
                </select>
            </span>

            <span>
                Usage Status:
                <select
                    title="selection"
                    className="client-machine-input"
                    value={usageStatus}
                    onChange={(e) => setUsageStatus(e.target.value)}
                >
                    <option value="" disabled>Select Status</option>
                    <option value="main">Main</option>
                    <option value="spare">Spare</option>
                    <option value="not in use">Not In Use</option>
                </select>
            </span>

            {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

            <button
                className="client-machine-save-button client-machine-input"
                onClick={saveMachine}
                disabled={loading}
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
