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

interface QuotationRecord {
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

export default function QuotationsPage({searchTerm, setSearchTerm}: SearchTermProps) {
    const [quotationList, setQuotationList]       = useState<QuotationRecord[]>([]);
const [clients, setClients]                   = useState<ClientOption[]>([]);
const [selectedClientId, setSelectedClientId] = useState('');
const [files, setFiles]                       = useState<File[]>([]);
const [uploading, setUploading]               = useState(false);
const [error, setError]                       = useState<string | null>(null);

const fileInputRef = useRef<HTMLInputElement | null>(null);
const bottomRef    = useRef<HTMLDivElement | null>(null);

// ── On mount: load existing Quotations and client list from backend ───────────
    useEffect(() => {
        fetchQuotations();
        fetchClients();
    }, []);

    // Auto-scroll to bottom whenever a new quotation is added
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [quotationList]);

    async function fetchQuotations() {
        try {
            const res = await apiFetch('/api/quotations');
            if (res.ok) {
                const data = await res.json();
                setQuotationList(data.quotations);
            }
        } catch (err) {
            console.error('Failed to load quotations:', err);
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

    // ── Upload Quotation files ────────────────────────────────────────────────────
    async function saveQuotation() {
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

            const res = await apiFetch('/api/quotations', {
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
            await fetchQuotations();

            // Reset form
            setSelectedClientId('');
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            console.error('Upload Quotation error:', err);
            setError('Network error / Invalid file type.');
        } finally {
            setUploading(false);
        }
    }

    // ── Download: request through the backend so auth is enforced ────────────────
    async function downloadQuotationFile(storedName: string, fileName: string) {
        try {
            const res = await apiFetch(`/api/quotations/download/${encodeURIComponent(storedName)}`);

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
            console.error('Download quotation error:', err);
            alert('Download failed. Please try again.');
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────
    async function deleteQuotation(id: string) {
        if (!window.confirm('Delete this quotation?')) return;
        try {
            const res = await apiFetch(`/api/quotations/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Delete failed.');
            }
            setQuotationList(prev => prev.filter(q => q._id !== id));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Delete failed.');
        }
    }

    // ── Filter Quotations by search term ─────────────────────────────────────────
    const filteredQuotations = quotationList.filter(quotation => {
        const search = searchTerm.toLowerCase();
        return (
            quotation.clientFactory.toLowerCase().includes(search) ||
            quotation.fileName.toLowerCase().includes(search) ||
            quotation.uploadedBy.toLowerCase().includes(search)
        );
    });

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="quotations-container reception-uploads-container">
            <title>Quotations</title>

            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {/* Quotation list */}
            <div className="quotations-list-container reception-uploads-list-container">
                {quotationList.length === 0 && (
                    <h3 className="reception-uploads-header">
                        Upload a quotation to get started
                    </h3>
                )}

                {filteredQuotations.map(quotation => (
                    <div className="quotations-card reception-uploads-card" key={quotation._id}>
                        <h3 className="reception-uploads-header">
                            {quotation.clientFactory ?? 'Unknown Client'}
                        </h3>

                        {/* File type icon */}
                        <p>
                            <img
                                src={getFileLogo(quotation.fileName)}
                                alt={quotation.fileName}
                                className="reception-uploads-document-preview"
                            />
                        </p>

                        {/* File name */}
                        <p>{quotation.fileName}</p>

                        {/* Download button — goes through the backend with auth */}
                        <p>
                            <button
                                className="report-uploads-download-file"
                                onClick={() => downloadQuotationFile(quotation.storedName, quotation.fileName)}
                            >
                                Download File
                            </button>
                        </p>
                        <p>
                            <button
                                onClick={() => deleteQuotation(quotation._id)}
                                className="report-uploads-download-file"
                            >
                                Delete File
                            </button>
                        </p>

                        <p className="quotations-poster reception-uploads-poster">
                            posted by: {quotation.uploadedBy ?? 'Unknown User'}
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
            <div className="quotations-input-container reception-input-container">
                {/* Client dropdown populated from the database */}
               <select
                    title="selection"
                    value={selectedClientId}
                    className="reception-input-select-factory"
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
                    name="quotation"
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
                    className="reception-uploads-button quotation-save-button"
                    onClick={saveQuotation}
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
