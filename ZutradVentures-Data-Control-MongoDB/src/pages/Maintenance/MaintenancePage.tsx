import { SearchBar } from "../../components/SearchBar";
import { useState, useEffect, useRef } from "react";
import type { MaintenanceData } from "./maintenanceTypes";
import './Maintenance.css';
import { MaintenanceMessages } from "./MaintenanceMessages";
import { Store } from "../../components/Store";
import { Administrator } from "../../components/Administrator";
import { Reports } from "../../components/Reports";
import { Supply } from "../../components/Supply";
import CheckMarkLogo from '../../assets/images/check-mark.png';
import { Clients } from "../../components/Clients";
import { Footer } from "../../components/Footer";
import ArrowUp from '../../assets/images/up-arrow.png';
import ArrowDown from '../../assets/images/down-arrow.png';
import { apiFetch } from "../../api";

interface SearchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}

interface ClientOption {
    _id: string;
    companyName: string;
}

export default function MaintenancePage({ searchTerm, setSearchTerm }: SearchTermProps) {
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceData[]>([]);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [message, setMessage] = useState('');
    const [machine, setMachine] = useState('');
    const [maintenanceDay, setMaintenanceDay] = useState('');
    const [clientId, setClientId] = useState('');
    const [alertMessage, setAlertMessage] = useState(false);
    const [toggleInput, setToggleInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        fetchLogs();
        fetchClients();
        fetchMaintenance();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [maintenanceLogs]);

    async function fetchLogs() {
        try {
            const response = await apiFetch('/api/maintenance');
            const data = await response.json();
            if (response.ok) setMaintenanceLogs(data.logs);
        } catch (err) {
            console.error('Failed to fetch maintenance logs:', err);
        }
    }

    async function fetchMaintenance() {
        try {
            const response = await apiFetch('/api/reports');
            const data = await response.json();
            if (response.ok) setMaintenanceDay(data.maintenance);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        }
    }

    async function fetchClients() {
        try {
            const response = await apiFetch('/api/clients');
            const data = await response.json();
            if (response.ok) setClients(data.clients);
        } catch (err) {
            console.error('Failed to fetch clients:', err);
        }
    }

    function toggleInputController() {
        setToggleInput(prev => !prev);
    }

    async function saveMessage() {
        setError('');
        setLoading(true);

        try {
            const response = await apiFetch('/api/maintenance', {
                method: 'POST',
                body: JSON.stringify({ message, machine, maintenanceDay, clientId })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            setMaintenanceLogs(prev => [data.log, ...prev]);

            setMessage('');
            setMachine('');
            setMaintenanceDay('');
            setClientId('');

            setAlertMessage(true);
            setTimeout(() => setAlertMessage(false), 2000);

        } catch (err) {
            setError(`${err}: Could not connect to the server.`);
        }

        setLoading(false);
    }

    const filteredLogs = maintenanceLogs.filter(log =>
        log.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.client?.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

    return (
        <div className="maintenance-page-container">
            <title>Maintenance</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <section className="maintenance-messages-container">
                <div className="maintenance-messages">
                    <h3 style={{ display: maintenanceLogs.length === 0 ? 'block' : 'none' }} className="maintenance-header">
                        Enter new maintenance to get started
                    </h3>
                    <MaintenanceMessages
                        maintenanceLogs={filteredLogs}
                        onMarkDone={fetchLogs}
                        onStatusChange={fetchLogs}
                        onDelete={(id) => setMaintenanceLogs(prev => prev.filter(log => log._id !== id))}
                    />
                    <div ref={bottomRef}></div>
                </div>

                <div className="input-controller-container-maintenance">
                    <img
                        src={toggleInput ? ArrowUp : ArrowDown}
                        title={toggleInput ? 'show input' : 'hide input'}
                        className="input-controller-maintenance"
                        onClick={toggleInputController}
                    />
                </div>

                <div className="input-maintenance-container" style={{ display: toggleInput ? 'none' : 'flex' }}>
                    <input
                        className="maintenance-summary-input"
                        type="text"
                        placeholder="brief summary of maintenance"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    {/* Client dropdown — pulled from the database */}
                    <select
                        title="selection"
                        value={clientId}
                        className="maintenance-select-machine"
                        onInput={(e) => {
                            const target = e.target as HTMLSelectElement;
                            setClientId(target.value);
                        }}
                    >
                        <option value="" disabled>Select Factory</option>
                        {clients.map(client => (
                            <option key={client._id} value={client._id}>
                                {client?.companyName ?? 'Unknown Client'}
                            </option>
                        ))}
                    </select>
                    <select
                        className="maintenance-select-machine"
                        title="selection"
                        value={machine}
                        onChange={(e) => setMachine(e.target.value)}
                    >
                        <option value="" disabled>Machine</option>
                        <option value="Macsa ID">Macsa ID</option>
                        <option value="Savema">Savema</option>
                        <option value="Sojet">Sojet</option>
                        <option value="BestCode">BestCode</option>
                    </select>
                    <label htmlFor="date of maintenance">Maintenance Day</label>
                    <input
                        type="date"
                        name="date of maintenance"
                        value={maintenanceDay}
                        className="maintenance-day"
                        onChange={(e) => setMaintenanceDay(e.target.value)}
                    />

                    {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

                    <button
                        className="button-save-maintenance-message"
                        onClick={saveMessage}
                        disabled={!message || !machine || !maintenanceDay || !clientId || loading}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <span className="check-mark-container" style={{ display: alertMessage ? 'inline' : 'none' }}>
                        <img src={CheckMarkLogo} style={{ width: '20px' }} />
                        <span className="alert-text">Created Successfully</span>
                    </span>
                </div>
            </section>
            <Administrator />
            <Store />
            <Reports />
            <Supply />
            <Clients />
            <Footer />
        </div>
    );
}
