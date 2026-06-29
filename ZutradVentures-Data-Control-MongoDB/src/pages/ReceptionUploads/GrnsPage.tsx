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

interface GrnRecord {
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

export default function GRNsPage({ searchTerm, setSearchTerm }: SearchTermProps) {
    const [grnList, setGrnList]       = useState<GrnRecord[]>([]);
    const [clients, setClients]       = useState<ClientOption[]>([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [files, setFiles]           = useState<File[]>([]);
    const [uploading, setUploading]   = useState(false);
    const [error, setError]           = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const bottomRef    = useRef<HTMLDivElement | null>(null);

    // ── On mount: load existing GRNs and client list from backend ──────────────
    useEffect(() => {
        fetchGrns();
        fetchClients();
    }, []);

    // Auto-scroll to bottom whenever a new GRN is added
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [grnList]);

    async function fetchGrns() {
        try {
            const res = await apiFetch('/api/grns');
            if (res.ok) {
                const data = await res.json();
                setGrnList(data.grns);
            }
        } catch (err) {
            console.error('Failed to load GRNs:', err);
        }
    }

    async function fetchClients() {
        try {
            const res = await apiFetch('/api/clients');
            if (res.ok) {
                const data = await res.json();
                // Expecting { clients: [{ id, companyName, ... }] }
                setClients(data.clients ?? []);
            }
        } catch (err) {
            console.error('Failed to load clients:', err);
        }
    }

    // ── Upload GRN files ───────────────────────────────────────────────────────
    async function saveGrn() {
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

            const res = await apiFetch('/api/grns', {
                method: 'POST',
                body: formData
                // Do NOT set Content-Type — apiFetch detects FormData and leaves it for the browser
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message ?? 'Upload failed. Please try again.');
                return;
            }

            // Refresh list from backend so we get server-assigned IDs and timestamps
            await fetchGrns();

            // Reset form
            setSelectedClientId('');
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            console.error('Upload GRN error:', err);
            setError('Network error / Invalid File type.');
        } finally {
            setUploading(false);
        }
    }

    // ── Download: request through the backend so auth is enforced ─────────────
    async function downloadFile(storedName: string, fileName: string) {
        try {
            const res = await apiFetch(`/api/grns/download/${encodeURIComponent(storedName)}`);

            if (!res.ok) {
                alert('Download failed. The file may have been removed.');
                return;
            }

            // Convert response to a Blob and trigger a browser download
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
            console.error('Download error:', err);
            alert('Download failed. Please try again.');
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────
    async function deleteGrn(id: string) {
        if (!window.confirm('Delete this GRN?')) return;
        try {
            const res = await apiFetch(`/api/grns/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Delete failed.');
            }
            setGrnList(prev => prev.filter(inv => inv._id !== id));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Delete failed.');
        }
    }

    // ── Filter GRNs by search term ─────────────────────────────────────────────
    const filteredGrns = grnList.filter(grn => {
        const search = searchTerm.toLowerCase();
        return (
            grn.clientFactory.toLowerCase().includes(search) ||
            grn.fileName.toLowerCase().includes(search) ||
            grn.uploadedBy.toLowerCase().includes(search)
        );
    });

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="grns-container reception-uploads-container">
            <title>GRNs</title>

            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {/* GRN list */}
            <div className="grns-list-container reception-uploads-list-container">
                {grnList.length === 0 && (
                    <h3 className="reception-uploads-header">
                        Upload a GRN to get started
                    </h3>
                )}

                {filteredGrns.map(grn => (
                    <div className="grns-card reception-uploads-card" key={grn._id}>
                        <h3 className="reception-uploads-header">
                            {grn.clientFactory ?? 'Unknown Client'}
                        </h3>

                        {/* File type icon */}
                        <p>
                            <img
                                src={getFileLogo(grn.fileName)}
                                alt={grn.fileName}
                                className="reception-uploads-document-preview"
                            />
                        </p>

                        {/* File name */}
                        <p>{grn.fileName}</p>

                        {/* Download button — goes through the backend with auth */}
                        <p>
                            <button
                                className="report-uploads-download-file"
                                onClick={() => downloadFile(grn.storedName, grn.fileName)}
                            >
                                Download File
                            </button>
                        </p>
                        <p>
                            <button
                                onClick={() => deleteGrn(grn._id)}
                                className="report-uploads-download-file"
                            >
                                Delete File
                            </button>
                        </p>

                        <p className="grns-poster reception-uploads-poster">
                            posted by: {grn.uploadedBy ?? 'Unknown User'}
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
            <div className="grns-input-container reception-input-container">
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
                    name="grn"
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
                    className="reception-uploads-button grn-save-button"
                    onClick={saveGrn}
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
