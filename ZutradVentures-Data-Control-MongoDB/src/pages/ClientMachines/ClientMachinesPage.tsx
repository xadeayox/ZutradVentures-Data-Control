import { useEffect, useRef, useState } from 'react';
import { Administrator } from '../../components/Administrator';
import { Maintenance } from '../../components/Maintenance';
import { Reports } from '../../components/Reports';
import { SearchBar } from '../../components/SearchBar';
import { Store } from '../../components/Store';
import { Supply } from '../../components/Supply';
import { ClientMachinesInput } from './ClientMachinesInput';
import { ClientMachines } from './ClientMachines';
import ArrowUp from '../../assets/images/up-arrow.png';
import ArrowDown from '../../assets/images/down-arrow.png';
import './ClientMachinesPage.css';
import { Footer } from '../../components/Footer';
import type { ClientData } from './clientTypes';
import { apiFetch } from '../../api';
import { HamBurgerLinks } from '../../components/HamBurgerLinks';

interface SearchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}

export default function ClientMachinesPage({ searchTerm, setSearchTerm }: SearchTermProps) {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [clients, setClients] = useState<ClientData[]>([]);
    const [displayInput, setDisplayInput] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ── Fetch all clients and their machines from the database ─────────────────
    // This replaces the old localStorage.getItem('clientMachines') approach
    async function fetchClients() {
        try {
            const response = await apiFetch('/api/clients');
            const data = await response.json();

            if (response.ok) {
                setClients(data.clients);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError(`${err}: Could not connect to the server.`);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [clients]);

    // ── Filter machines across all clients by search term ─────────────────────
    // Searches by serial number, machine type, or company name
    const filteredClients = clients.map(client => ({
        ...client,
        machines: client.machines.filter(machine =>
            machine.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            machine.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(client => client.machines.length > 0);

    function toggleDisplayInput() {
        setDisplayInput(prev => !prev);
    }

    const allMachines = clients.flatMap(c => c.machines);

    return (
        <div className="clients-machine-page-container">
            <title>Client Machines</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="client-machines-content-container">

                {loading && <h3 className="machine-header-message">Loading...</h3>}
                {error && <h3 className="machine-header-message" style={{ color: 'red' }}>{error}</h3>}

                {!loading && allMachines.length === 0 && (
                    <h3 className="machine-header-message">Log a machine to get started</h3>
                )}

                {!loading && searchTerm && filteredClients.length === 0 && (
                    <h3 className="machine-header-message">No results</h3>
                )}

                {/* Group machines under their client company */}
                {filteredClients.map(client => (
                    <div key={client._id}>
                        <h2 style={{ padding: '10px', color: 'rgb(99, 99, 99)' }}>
                            {client.companyName} — {client.address}
                        </h2>
                        {client.machines.map(machine => (
                            <ClientMachines
                                key={machine._id}
                                machine={machine}
                                onUpdate={fetchClients}  // re-fetch after update
                                onDelete={fetchClients}  // re-fetch after delete
                            />
                        ))}
                    </div>
                ))}
            </div>

            <div ref={bottomRef}></div>
            <div className="input-controller-container-client">
                <img
                    src={displayInput ? ArrowDown : ArrowUp}
                    title={displayInput ? 'hide inputs' : 'show inputs'}
                    className="input-controller-client"
                    onClick={toggleDisplayInput}
                />
            </div>

            <ClientMachinesInput
                displayInput={displayInput}
                clients={clients}
                onMachineAdded={fetchClients}   // re-fetch after a new machine is added
            />

            <Administrator />
            <Maintenance />
            <HamBurgerLinks />
            <Reports />
            <Store />
            <Supply />
            <Footer />
        </div>
    );
}
