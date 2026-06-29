import { Footer } from "../../components/Footer";
import { SearchBar } from "../../components/SearchBar";
import { Store } from "../../components/Store";
import { Supply } from "../../components/Supply";
import { Maintenance } from "../../components/Maintenance";
import { Reports } from "../../components/Reports";
import { Clients } from "../../components/Clients";
import { Administrator } from "../../components/Administrator";
import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import './AllSubPage.css';
import { HamBurgerLinks } from "../../components/HamBurgerLinks";

interface searchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}

interface Machine {
    _id: string;
    machine: string;
    serialNumber: string;
    lineInstalled: number;
    installedDate: string;
    maintenanceCycle: number;
    lastMaintenanceDate: string;
    usageStatus: string;
}

interface Client {
    _id: string;
    companyName: string;
    address: string;
    machines: Machine[];
}

export default function AllClients({ searchTerm, setSearchTerm }: searchTermProps) {

    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    async function fetchClients() {
        try {
            const response = await apiFetch('/api/clients');

            if (!response.ok) {
                throw new Error('Failed to fetch clients');
            }

            const data = await response.json();

            setClients(data.clients);
            setFilteredClients(data.clients);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteClient(id: string) {
        const client = clients.find(c => c._id === String(id));

        const confirmed = window.confirm(
            `Delete ${client?.companyName}? This will also delete all machines under it.`
        );

        if (!confirmed) return;

        try {
            const response = await apiFetch(`/api/clients/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setClients(prev => prev.filter(c => c._id !== String(id)));
            setFilteredClients(prev => prev.filter(c => c._id !== String(id)));

        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Failed to delete client');
        }
    }

    async function deleteMachine(id: string) {
        const confirmed = window.confirm('Delete this machine?');

        if (!confirmed) return;

        try {
            const response = await apiFetch(`/api/clients/machines/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setClients(prev =>
                prev.map(client => ({
                    ...client,
                    machines: client.machines.filter(m => m._id !== String(id))
                }))
            );

            setFilteredClients(prev =>
                prev.map(client => ({
                    ...client,
                    machines: client.machines.filter(m => m._id !== String(id))
                }))
            );

        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Failed to delete machine');
        }
    }

    useEffect(() => {
        const query = searchTerm.toLowerCase().trim();

        if (!query) {
            setFilteredClients(clients);
            return;
        }

        const filtered = clients.filter(client => {

            const companyMatch =
                client.companyName.toLowerCase().includes(query) ||
                client.address.toLowerCase().includes(query)

            const machineMatch =
                client.machines?.some(machine =>
                    machine.machine.toLowerCase().includes(query) ||
                    machine.serialNumber.toLowerCase().includes(query) ||
                    String(machine.lineInstalled).includes(query)
                );

            return companyMatch || machineMatch;
        });

        setFilteredClients(filtered);

    }, [searchTerm, clients]);

    return (
        <div className="all-sub-page-container">
            <title>All Clients</title>

            <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            <div className="all-sub-page-contents">

                {loading && <h3>Loading clients...</h3>}

                {!loading && filteredClients.length === 0 && (
                    <h3 className="sub-page-card-header">
                        No clients found.
                    </h3>
                )}

                {filteredClients.map(client => (
                    <div key={client._id} className="sub-page-card all-clients-sub-page-card">

                        {/* CLIENT HEADER */}
                        <h3 className="sub-page-card-header">
                            <span className="sub-full-name">
                                {client.companyName}
                            </span>
                            : {client.address}
                        </h3>

                        {/* MACHINES (COLLAPSIBLE) */}
                        <details className="sub-page-card-contents">
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                Machines ({client.machines?.length || 0})
                            </summary>

                            {client.machines?.length > 0 ? (
                                client.machines.map(machine => (
                                    <div key={machine._id} className='all-client-machine-contents'>

                                        <p>Machine: {machine.machine}</p>
                                        <p>Serial: {machine.serialNumber}</p>
                                        <p>Line: {machine.lineInstalled}</p>
                                        <p>Installed: {machine.installedDate}</p>
                                        <p>Cycle: {machine.maintenanceCycle} months</p>
                                        <p>Last Maintenance: {machine.lastMaintenanceDate}</p>
                                        <p>Status: {machine.usageStatus}</p>

                                        <button
                                            className="sub-page-delete-button"
                                            onClick={() => deleteMachine(machine._id)}
                                        >
                                            Delete Machine
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p>No machines assigned.</p>
                            )}
                        </details>

                        {/* ONLY ONE CLIENT DELETE BUTTON */}
                        <button
                            className="sub-page-delete-button"
                            onClick={() => deleteClient(client._id)}
                        >
                            Delete Client
                        </button>

                    </div>
                ))}

            </div>
            <HamBurgerLinks />
            <Administrator />
            <Store />
            <Supply />
            <Maintenance />
            <Reports />
            <Clients />
            <Footer />
        </div>
    );
}