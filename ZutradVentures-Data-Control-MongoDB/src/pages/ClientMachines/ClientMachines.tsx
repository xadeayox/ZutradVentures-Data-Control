import MacsaImage from "../../assets/images/macsa-id-laser.png";
import SavemaImage from "../../assets/images/savema-printer.png";
import SojetImage from "../../assets/images/sojet-handheld-printer.png";
import BestCodeImage from "../../assets/images/bestcode-printer.png";
import { useState } from "react";
import type { MachineData } from './clientTypes';
import { apiFetch } from "../../api";

interface ClientMachineProps {
    machine: MachineData;
    onUpdate: () => void;   // called after a successful update to refresh the list
    onDelete: () => void;   // called after a successful delete to refresh the list
}

export function ClientMachines({ machine, onUpdate, onDelete }: ClientMachineProps) {
    const [toggle, setToggle] = useState(false);
    const [updateDate, setUpdateDate] = useState('');
    const [updateUsage, setUpdateUsage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function saveUpdate() {
        if (!updateDate || !updateUsage) return;

        setLoading(true);
        setError('');

        try {

            // PATCH request — only sends the fields that changed
            const response = await apiFetch(`/api/clients/machines/${machine._id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    lastMaintenanceDate: updateDate,
                    usageStatus: updateUsage
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            setToggle(false);
            setUpdateDate('');
            setUpdateUsage('');
            onUpdate();  // tell the parent page to re-fetch updated data

        } catch (err) {
            setError(`${err}: Could not connect to the server.`);
        }

        setLoading(false);
    }

    async function deleteMachine() {
        if (!window.confirm('Are you sure you want to delete this machine?')) return;

        try {

            const response = await apiFetch(`/api/clients/machines/${machine._id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                onDelete();  // tell the parent page to re-fetch after deletion
            }

        } catch (err) {
            setError(`${err}: Could not connect to the server.`);
        }
    }

    return (
        <div className="client-machine-card">
            <h3 className="client-machine-card-header">
                SN: {machine.serialNumber} || Machine: {machine.machine}
            </h3>
            <div className="client-machine-details-wrapper">
                <p className="client-machine-details-container">
                    <span className="client-machine-details">
                        Line Installed: Line {machine.lineInstalled}
                    </span>
                    <span className="client-machine-details">
                        Installation Date: {machine.installedDate}
                    </span>
                    <span className="client-machine-details">
                        Maintenance Cycle: {machine.maintenanceCycle} months
                    </span>
                    <span className="client-machine-details">
                        Last Maintenance Date:{' '}
                        <span style={{ display: toggle ? 'none' : 'inline' }}>
                            {machine.lastMaintenanceDate}
                        </span>
                        <input
                            type="date"
                            style={{ display: toggle ? 'inline' : 'none' }}
                            className="client-machine-update-details"
                            value={updateDate}
                            onChange={(e) => setUpdateDate(e.target.value)}
                        />
                    </span>
                    <span className="client-machine-details">
                        Usage Status:{' '}
                        <span style={{ display: toggle ? 'none' : 'inline' }}>
                            {machine.usageStatus}
                        </span>
                        <select
                            title="selection"
                            style={{ display: toggle ? 'inline' : 'none' }}
                            className="client-machine-update-details"
                            value={updateUsage}
                            onChange={(e) => setUpdateUsage(e.target.value)}
                        >
                            <option value="" disabled>Select Status</option>
                            <option value="main">Main</option>
                            <option value="spare">Spare</option>
                            <option value="not in use">Not In Use</option>
                        </select>
                    </span>
                    {error && <span style={{ color: 'red', fontSize: '0.85rem' }}>{error}</span>}
                </p>
                <img
                    src={
                        machine.machine === 'Macsa ID' ? MacsaImage :
                        machine.machine === 'Savema' ? SavemaImage :
                        machine.machine === 'Sojet' ? SojetImage :
                        BestCodeImage
                    }
                    title="machine-image"
                    className='client-machine-image'
                />
            </div>
            <div className="client-machine-buttons-container">
                <button
                    className="client-machine-button client-machine-button-update"
                    onClick={() => setToggle(prev => !prev)}
                    style={{ backgroundColor: toggle ? 'rgb(255, 126, 0)' : 'green' }}
                >
                    {toggle ? 'Cancel' : 'Update'}
                </button>
                <button
                    className="client-machine-button client-machine-button-update"
                    style={{ display: toggle ? 'inline' : 'none' }}
                    onClick={saveUpdate}
                    disabled={!updateDate || !updateUsage || loading}
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                    className="client-machine-button client-machine-button-delete"
                    onClick={deleteMachine}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
