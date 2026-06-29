import { useState, useRef, useEffect } from 'react';
import { SearchBar } from '../../components/SearchBar';
import { ReportMessages } from './ReportMessages';
import './Reports.css';
import { Administrator } from '../../components/Administrator';
import { Store } from '../../components/Store';
import { Supply } from '../../components/Supply';
import { Maintenance } from '../../components/Maintenance';
import CheckMarkLogo from '../../assets/images/check-mark.png';
import { Clients } from '../../components/Clients';
import ArrowUp from '../../assets/images/up-arrow.png';
import ArrowDown from '../../assets/images/down-arrow.png';
import { Footer } from '../../components/Footer';
import type { ReportData } from './reportTypes';
import { apiFetch } from '../../api';
import { HamBurgerLinks } from '../../components/HamBurgerLinks';

interface SearchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}


// What a client looks like in the factory dropdown
interface ClientOption {
    _id: string;
    companyName: string;
}

export default function ReportsPage({ searchTerm, setSearchTerm }: SearchTermProps) {
    const [reportDetails, setReportDetails] = useState('');
    const [clientId, setClientId] = useState('');
    const [lineNumber, setLineNumber] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [preview, setPreview] = useState<string[]>([]);

    const [reports, setReports] = useState<ReportData[]>([]);
    const [clients, setClients] = useState<ClientOption[]>([]);

    const [alertMessage, setAlertMessage] = useState(false);
    const [toggleInput, setToggleInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Get the logged in user's role from localStorage
    // This is used to disable approve/reject buttons for non-admins
    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const userRole = currentUser?.role;

    // ── Fetch reports and clients on page load ─────────────────────────────────
    useEffect(() => {
        fetchReports();
        fetchClients();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [reports]);

    async function fetchReports() {
        try {
            const response = await apiFetch('/api/reports');
            const data = await response.json();
            if (response.ok) setReports(data.reports);
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

    function toggleDisplay() {
        setToggleInput(prev => !prev);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (selectedFiles) {
            const fileArray = Array.from(selectedFiles);
            setFiles(fileArray);

            const newPreviews: string[] = [];
            fileArray.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        newPreviews.push(reader.result as string);
                        setPreview([...newPreviews]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    async function saveReport() {
        setError('');

        if (!reportDetails || !clientId || lineNumber === 0) {
            setError('Report details, factory and line number are required.');
            return;
        }

        setLoading(true);

        try {

            // We use FormData instead of JSON because we're sending both
            // text fields AND image files in the same request
            const formData = new FormData();
            formData.append('reportDetails', reportDetails);
            formData.append('clientId', clientId);
            formData.append('lineNumber', String(lineNumber));
            files.forEach(file => formData.append('images', file));

            const response = await apiFetch('/api/reports', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            // Add the new report to the top of the list
            setReports(prev => [data.report, ...prev]);

            // Clear the form
            setReportDetails('');
            setClientId('');
            setLineNumber(0);
            setFiles([]);
            setPreview([]);
            if (fileInputRef.current) fileInputRef.current.value = '';

            setAlertMessage(true);
            setTimeout(() => setAlertMessage(false), 2000);

        } catch (err) {
            setError(` ${err}: Could not connect to the server.`);
        }

        setLoading(false);
    }

    // Filter reports by factory name or report details
    const filteredReports = reports.filter(report =>
        (report.client?.companyName ?? 'Unknown Client')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            report.reportDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(report.lineNumber).includes(searchTerm)
    );

    return (
        <div>
            <title>Reports</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="sub-search-container">
            </div>
            <div className="reports-container">
                <div className="reports-messages">
                    <h3 className="reports-header" style={{ display: reports.length === 0 ? 'block' : 'none' }}>
                        Enter reports to get started
                    </h3>
                    <ReportMessages
                        reports={filteredReports}
                        userRole={userRole}
                        onStatusChange={fetchReports}
                    />
                    <div ref={bottomRef}></div>
                </div>
                <div className="input-controller-container-reports">
                    <img
                        className="input-controller-reports"
                        src={toggleInput ? ArrowDown : ArrowUp}
                        title={toggleInput ? 'hide inputs' : 'show inputs'}
                        onClick={toggleDisplay}
                    />
                </div>
                <div className="reports-input" style={{ display: toggleInput ? 'flex' : 'none' }}>
                    <textarea
                        placeholder="enter report..."
                        className="report-textarea-input"
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                    />
                    <div className="report-factory-line-container">
                        {/* Factory dropdown — pulled from the clients database */}
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
                        <input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="line number"
                            className="report-factory-line"
                            value={lineNumber}
                            onChange={(e) => setLineNumber(Number(e.target.value))}
                        />
                        Upload Picture:
                        <input
                            type="file"
                            accept="image/*"
                            className="input-report-picture"
                            multiple
                            onChange={handleFileChange}
                            ref={fileInputRef}
                        />
                    </div>
                    <div className='images-input-container'>
                        {preview.map((src, index) => (
                            <img className='images-input' key={index} src={src} alt={`Preview ${index}`} />
                        ))}
                    </div>

                    {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

                    <button
                        className="save-reports-button"
                        disabled={!reportDetails || !clientId || lineNumber === 0 || loading}
                        onClick={saveReport}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <span className="check-mark-container" style={{ display: alertMessage ? 'inline' : 'none' }}>
                        <img src={CheckMarkLogo} style={{ width: '20px' }} />
                        <span className="alert-text">Created Successfully</span>
                    </span>
                </div>
            </div>
            <HamBurgerLinks />
            <Administrator />
            <Store />
            <Supply />
            <Maintenance />
            <Clients />
            <Footer />
        </div>
    );
}
