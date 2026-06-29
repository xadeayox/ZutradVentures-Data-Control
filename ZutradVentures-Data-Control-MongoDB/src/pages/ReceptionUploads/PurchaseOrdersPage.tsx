import { Footer } from "../../components/Footer";
import { SearchBar } from "../../components/SearchBar";
import { useState, useEffect, useRef } from "react";
import './ReceptionUploads.css';
import { HamBurgerLinks } from "../../components/HamBurgerLinks";
import { Administrator } from "../../components/Administrator";
import { Store } from "../../components/Store";
import { Supply } from "../../components/Supply";
import { Maintenance } from "../../components/Maintenance";
import { Clients } from "../../components/Clients";
import { Reports } from "../../components/Reports";
import ReportLogo from '../../assets/images/report-logo.png';
import PDFLogo from '../../assets/images/pdf-logo.png';
import msWordLogo from '../../assets/images/msword-logo.png';
import msExcelLogo from '../../assets/images/msexcel-logo.png';
import { apiFetch } from '../../api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseOrderRecord {
    _id: string;
    fileName: string;
    storedName: string;
    mimeType: string;
    clientFactory: string;   // "Unknown Client" if the client was deleted
    uploadedBy: string;
    createdAt: string;
}

interface ClientOption {
    _id: string;
    companyName: string;
}

interface SearchTermProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileLogo(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf')  return PDFLogo;
    if (ext === 'docx' || ext === 'doc') return msWordLogo;
    if (ext === 'xlsx' || ext === 'xls') return msExcelLogo;
    return ReportLogo;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage({ searchTerm, setSearchTerm }: SearchTermProps) {
    const [purchaseOrderList, setPurchaseOrderList] = useState<PurchaseOrderRecord[]>([]);
    const [clients, setClients]                   = useState<ClientOption[]>([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [files, setFiles]                       = useState<File[]>([]);
    const [uploading, setUploading]               = useState(false);
    const [error, setError]                       = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const bottomRef    = useRef<HTMLDivElement | null>(null);

    // ── On mount: load existing Purchase Orders and client list ───────────────
    useEffect(() => {
        fetchPurchaseOrders();
        fetchClients();
    }, []);

    // Auto-scroll to bottom whenever a new Purchase Order is added
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [purchaseOrderList]);

    async function fetchPurchaseOrders() {
        try {
            const res = await apiFetch('/api/purchaseorders');
            if (res.ok) {
                const data = await res.json();
                setPurchaseOrderList(data.purchaseOrders);
            }
        } catch (err) {
            console.error('Failed to load Purchase Orders:', err);
        }
    }

    async function fetchClients() {
        try {
            const res = await apiFetch('/api/clients');
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients ?? []);
            }
        } catch (err) {
            console.error('Failed to load clients:', err);
        }
    }

    // ── Upload Purchase Order files ───────────────────────────────────────────
    async function savePurchaseOrder() {
        setError(null);

        if (!selectedClientId) {
            setError('Please select a client factory.');
            return;
        }
        if (files.length === 0) {
            setError('Please attach at least one file.');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('clientId', selectedClientId);
            files.forEach(f => formData.append('files', f));

            const res = await apiFetch('/api/purchaseorders', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message ?? 'Upload failed. Please try again.');
                return;
            }

            await fetchPurchaseOrders();

            setSelectedClientId('');
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            console.error('Upload Purchase Order error:', err);
            setError('Network error / Invalid file type.');
        } finally {
            setUploading(false);
        }
    }

    // ── Download Purchase Order file ──────────────────────────────────────────
    async function downloadPurchaseOrderFile(storedName: string, fileName: string) {
        try {
            const res = await apiFetch(`/api/purchaseorders/download/${encodeURIComponent(storedName)}`);
            if (!res.ok) {
                alert('Download failed. The file may have been removed.');
                return;
            }

            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href     = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Download Purchase Order error:', err);
            alert('Download failed. Please try again.');
        }
    }

    // ── Delete Purchase Order ────────────────────────────────────────────────
    async function deletePurchaseOrder(id: string) {
        if (!window.confirm('Delete this Purchase Order?')) return;
        try {
            const res = await apiFetch(`/api/purchaseorders/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Delete failed.');
            }
            setPurchaseOrderList(prev => prev.filter(po => po._id !== id));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Delete failed.');
        }
    }

    // ── Filter Purchase Orders by search term ─────────────────────────────────
    const filteredPurchaseOrders = purchaseOrderList.filter(po => {
        const search = searchTerm.toLowerCase();
        return (
            po.clientFactory.toLowerCase().includes(search) ||
            po.fileName.toLowerCase().includes(search) ||
            po.uploadedBy.toLowerCase().includes(search)
        );
    });

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="purchase-orders-container reception-uploads-container">
            <title>Purchase Orders</title>

            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {/* Purchase Order list */}
            <div className="purchase-orders-list-container reception-uploads-list-container">
                {purchaseOrderList.length === 0 && (
                    <h3 className="reception-uploads-header">
                        Upload a Purchase Order to get started
                    </h3>
                )}

                {filteredPurchaseOrders.map(po => (
                    <div className="purchase-orders-card reception-uploads-card" key={po._id}>
                        <h3 className="reception-uploads-header">
                            {po.clientFactory ?? 'Unknown Client'}
                        </h3>

                        {/* File type icon */}
                        <p>
                            <img
                                src={getFileLogo(po.fileName)}
                                alt={po.fileName}
                                className="reception-uploads-document-preview"
                            />
                        </p>

                        {/* File name */}
                        <p>{po.fileName}</p>

                        {/* Download button — goes through the backend with auth */}
                        <p>
                            <button
                                className="report-uploads-download-file"
                                onClick={() => downloadPurchaseOrderFile(po.storedName, po.fileName)}
                            >
                                Download File
                            </button>
                        </p>
                        <p>
                            <button
                                onClick={() => deletePurchaseOrder(po._id)}
                                className="report-uploads-download-file"
                            >
                                Delete File
                            </button>
                        </p>

                        <p className="purchase-orders-poster reception-uploads-poster">
                            posted by: {po.uploadedBy ?? 'Unknown User'}
                        </p>
                    </div>
                ))}
            </div>

            <div ref={bottomRef} />

            {/* Error message */}
            {error && (
                <p style={{ color: 'red', textAlign: 'center', margin: '8px 0' }}>
                    {error}
                </p>
            )}

            {/* Upload form */}
            <div className="purchase-orders-input-container reception-input-container">
                {/* Client dropdown populated from the database */}
                <select
                    title="selection"
                    value={selectedClientId}
                    className="report-factory-selection"
                    onInput={(e) => {
                        const target = e.target as HTMLSelectElement;
                        setSelectedClientId(target.value);
                    }}
                >
                    <option value="" disabled>Select Factory</option>
                    {clients.map(client => (
                        <option key={client._id} value={client._id}>
                            {client?.companyName ?? 'Unknown Client'}
                        </option>
                    ))}
                </select>

                {/* File picker — accepts PDF, Word, Excel; multiple files */}
                <input
                    type="file"
                    name="purchaseOrder"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    ref={fileInputRef}
                    className="reception-uploads-file"
                    onChange={e => {
                        if (e.target.files) {
                            setFiles(Array.from(e.target.files));
                        }
                    }}
                />

                <button
                    className="reception-uploads-button purchase-order-save-button"
                    onClick={savePurchaseOrder}
                    disabled={uploading || files.length === 0 || !selectedClientId}
                >
                    {uploading ? 'Uploading…' : 'Save'}
                </button>
            </div>

            <HamBurgerLinks />
            <Administrator />
            <Store />
            <Reports />
            <Supply />
            <Maintenance />
            <Clients />
            <Footer />
        </div>
    );

}