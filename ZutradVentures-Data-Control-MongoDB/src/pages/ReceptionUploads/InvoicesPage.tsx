import { Footer } from "../../components/Footer";
import { SearchBar } from "../../components/SearchBar"
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
import { apiFetch } from "../../api";

// ─── Types ────────────────────────────────────────────────────────────────────
// Matches the shape returned by GET /api/invoices
interface InvoiceRecord {
    _id: string;
    clientId: string | null;
    clientName: string | null;
    uploadedBy: string;
    fileName: string;
    storedFileName: string;
    mimeType: string | null;
    fileSize: number | null;
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

// ─── Logo helper ──────────────────────────────────────────────────────────────
function fileLogo(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf')                      return PDFLogo;
    if (ext === 'doc' || ext === 'docx')    return msWordLogo;
    if (ext === 'xls' || ext === 'xlsx')    return msExcelLogo;
    return ReportLogo;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function InvoicesPage({ searchTerm, setSearchTerm }: SearchTermProps) {
    const [clients, setClients]               = useState<ClientOption[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [invoiceList, setInvoiceList]       = useState<InvoiceRecord[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading]       = useState(false);
    const [error, setError]               = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const bottomRef    = useRef<HTMLDivElement | null>(null);

    // ── Scroll to bottom whenever list changes ────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [invoiceList]);

    // ── Fetch clients for the dropdown and invoices on mount ─────────────
    useEffect(() => {
        fetchClients();
        fetchInvoices();
    }, []);

    async function fetchClients() {
        try {
            const res  = await apiFetch('/api/invoices/clients');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setClients(data.clients);
        } catch {
            console.error('Could not load clients for dropdown.');
        }
    }

    async function fetchInvoices(search = '') {
        try {
            const query = search ? `?search=${encodeURIComponent(search)}` : '';
            const res   = await apiFetch(`/api/invoices${query}`);
            if (!res.ok) throw new Error('Failed to load invoices.');
            const data  = await res.json();
            setInvoiceList(data.invoices);
        } catch (err) {
            console.error(err);
            setError('Could not load invoices.');
        }
    }

    async function saveInvoice() {
        if (!selectedFile || !selectedClientId) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('clientId', String(selectedClientId));
            formData.append('invoice', selectedFile);

            const res = await apiFetch('/api/invoices', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Upload failed.');
            }

            await fetchInvoices(searchTerm);
            setSelectedClientId('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Upload failed.');
        } finally {
            setUploading(false);
        }
    }

    // ── Download ──────────────────────────────────────────────────────────
    // Fetches the file as a blob, then triggers a browser download —
    // this keeps the Authorization header in the request (a plain <a href>
    // would not send it).
    async function downloadInvoice(invoice: InvoiceRecord) {
        try {
            const res = await apiFetch(`/api/invoices/${invoice._id}/download`);
            if (!res.ok) throw new Error('Download failed.');

            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = invoice.fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            setError('Could not download file.');
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────
    async function deleteInvoice(id: string) {
        if (!window.confirm('Delete this invoice?')) return;
        try {
            const res = await apiFetch(`/api/invoices/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Delete failed.');
            }
            setInvoiceList(prev => prev.filter(inv => inv._id !== id));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Delete failed.');
        }
    }

    // ── Local search (debounced via re-fetch) ─────────────────────────────
    function handleSearchChange(term: string) {
        setSearchTerm(term);
        fetchInvoices(term);
    }

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="invoices-container reception-uploads-container">
            <title>Invoices</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={handleSearchChange} />

            {error && (
                <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>
            )}

            <div className="invoices-list-container reception-uploads-list-container">
                <h3
                    className="reception-uploads-header"
                    style={{ display: invoiceList.length === 0 ? 'block' : 'none' }}
                >
                    Upload an Invoice to get started
                </h3>

                {invoiceList.map((invoice) => (
                    <div className="invoices-card reception-uploads-card" key={invoice._id}>
                        <h3 className="reception-uploads-header">
                            {invoice.clientName ?? 'Unknown Client'}
                        </h3>

                        {/* File type icon */}
                        <p>
                            <img
                                src={fileLogo(invoice.fileName)}
                                alt={invoice.fileName}
                                className="reception-uploads-document-preview"
                            />
                        </p>

                        {/* File name */}
                        <p>{invoice.fileName}</p>

                        {/* Download button — hits the authenticated backend endpoint */}
                        <p>
                            <button
                                onClick={() => downloadInvoice(invoice)}
                                className="report-uploads-download-file"
                            >
                                Download File
                            </button>
                        </p>

                        {/* Delete button */}
                        <p>
                            <button
                                onClick={() => deleteInvoice(invoice._id)}
                                className="report-uploads-download-file"
                            >
                                Delete File
                            </button>
                        </p>

                        <p className="invoices-poster reception-uploads-poster">
                            posted by: {invoice.uploadedBy ?? 'Unknown User'}
                        </p>
                    </div>
                ))}
            </div>

            <div ref={bottomRef}></div>

            {/* ── Upload form ─────────────────────────────────────────── */}
            <div className="invoices-input-container reception-input-container">
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

                <input
                    type="file"
                    name="invoice"
                    className="reception-uploads-file"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />

                <button
                    className="reception-uploads-button invoice-save-button"
                    onClick={saveInvoice}
                    disabled={!selectedFile || !selectedClientId || uploading}
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
