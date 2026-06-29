import { SearchBar } from "../../components/SearchBar";
import { useState, useRef, useEffect } from "react";
import type { SupplyData } from "./supplyTypes";
import CheckMarkLogo from '../../assets/images/check-mark.png';
import './SupplyPage.css';
import { Administrator } from "../../components/Administrator";
import { Maintenance } from "../../components/Maintenance";
import { Reports } from "../../components/Reports";
import { Store } from "../../components/Store";
import { Clients } from "../../components/Clients";
import ArrowUp from '../../assets/images/up-arrow.png';
import ArrowDown from '../../assets/images/down-arrow.png';
import { Footer } from "../../components/Footer";
import { apiFetch } from "../../api";
import { HamBurgerLinks } from "../../components/HamBurgerLinks";

interface SearchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}

interface ClientOption {
    _id: string;
    companyName: string;
}

export default function SupplyPage({ searchTerm, setSearchTerm }: SearchTermProps) {
    const [alertMessage, setAlertMessage] = useState(false);
    const [supplies, setSupplies] = useState<SupplyData[]>([]);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [goodsSupplied, setGoodsSupplied] = useState('');
    const [partNumber, setPartNumber] = useState('');
    const [clientId, setClientId] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [supplyDate, setSupplyDate] = useState('');
    const [toggleInput, setToggleInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        fetchSupplies();
        fetchClients();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [supplies]);

    async function fetchSupplies() {
        try {
            const response = await apiFetch('/api/supply');
            const data = await response.json();
            if (response.ok) setSupplies(data.supplies);
        } catch (err) {
            console.error('Failed to fetch supplies:', err);
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

    function toggleInputDisplay() {
        setToggleInput(prev => !prev);
    }

    async function saveSupply() {
        setError('');
        setLoading(true);

        try {
            const response = await apiFetch('/api/supply', {
                method: 'POST',
                body: JSON.stringify({ goodsSupplied, partNumber, clientId, quantity, supplyDate })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            // Add the new supply to the top of the list
            setSupplies(prev => [data.supply, ...prev]);

            // Clear the form
            setGoodsSupplied('');
            setPartNumber('');
            setClientId('');
            setQuantity(0);
            setSupplyDate('');

            setAlertMessage(true);
            setTimeout(() => setAlertMessage(false), 2000);

        } catch (err) {
            setError(`${err}: Could not connect to the server.`);
        }

        setLoading(false);
    }

    async function deleteSupply(id: number) {
        if (!window.confirm('Delete this Supply?')) return;
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch(`/api/supply/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Delete failed.');
            }
            setSupplies(prev => prev.filter(s => s._id !== id)); // ✅ removes it instantly
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Delete failed.');
        }
        setLoading(false);
    }

    // Filter by goods name or client company name
    const filteredSupplies = supplies.filter(item =>
        item.goodsSupplied.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="supply-page-container">
            <title>Supply</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="supply-content-container">
                <h3 style={{ display: supplies.length > 0 ? 'none' : 'block' }} className="supply-message-header">
                    Enter Supply to get Started
                </h3>
                {filteredSupplies.map((item) => (
                    <div className="supply-item-card" key={item._id}>
                        <h3 className="supply-item-header">
                            {item.goodsSupplied} : {item.client?.companyName ?? 'Unknown Client'}
                        </h3>
                        <span className="supply-item-details">
                            Part Number: {item.partNumber}
                        </span>
                        <span className="supply-item-details">
                            Quantity Supplied: {item.quantity}
                        </span>
                        <span className="supply-item-details">
                            Supply Date: {item.supplyDate}
                        </span>
                        <span>
                            <button 
                                className="delete-supply-button"
                                onClick={() => deleteSupply(item._id)}
                            >
                                Delete
                            </button>
                        </span>
                        <div className="supply-items-date-logged">
                            Date Logged: {new Date(item.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })} — by {item.user ? `${item.user.firstName} ${item.user.surname}` : 'Deleted User'}
                        </div>
                    </div>
                ))}
            </div>

            <div ref={bottomRef}></div>

            <div className="input-controller-container-supply">
                <img
                    className="input-controller-supply"
                    src={toggleInput ? ArrowDown : ArrowUp}
                    title={toggleInput ? 'hide inputs' : 'show inputs'}
                    onClick={toggleInputDisplay}
                />
            </div>

            <div className="supply-input-container" style={{ display: toggleInput ? 'flex' : 'none' }}>
                <input
                    type="text"
                    placeholder="goods supplied"
                    className="supply-page-input"
                    value={goodsSupplied}
                    onChange={(e) => setGoodsSupplied(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="part number"
                    className="supply-page-input"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                />
                Factory:
                <select
                    title="selection"
                    value={clientId}
                    className="report-factory-selection"
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
                <span>
                    Quantity:
                    <input
                        type="number"
                        step="1"
                        min="1"
                        className="supply-page-input supply-page-input-quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                </span>
                <span>
                    Supply Date:
                    <input
                        type="date"
                        className="supply-page-input"
                        value={supplyDate}
                        onChange={(e) => setSupplyDate(e.target.value)}
                    />
                </span>

                {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

                <button
                    className="supply-page-input supply-page-input-button"
                    onClick={saveSupply}
                    disabled={!goodsSupplied || !partNumber || !clientId || quantity === 0 || !supplyDate || loading}
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
                <span className="check-mark-container" style={{ display: alertMessage ? 'inline' : 'none' }}>
                    <img src={CheckMarkLogo} style={{ width: '20px' }} />
                    <span className="alert-text">Created Successfully</span>
                </span>
            </div>
            <HamBurgerLinks />
            <Administrator />
            <Maintenance />
            <Reports />
            <Store />
            <Clients />
            <Footer />
        </div>
    );
}
