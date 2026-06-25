import { Footer } from "../../components/Footer";
import { SearchBar } from "../../components/SearchBar"
import type { invoice } from "../../interface/invoice";
import { useState, useEffect, useRef } from "react";
import './ReceptionUploads.css';
import { HamBurgerLinks } from "../../components/HamBurgerLinks";
import { Administrator } from "../../components/Administrator";
import { Store } from "../../components/Store";
import { Supply } from "../../components/Supply";
import { Maintenance } from "../../components/Maintenance";
import { Clients } from "../../components/Clients";
import { Reports } from "../../components/Reports";
import SearchIcon from '../../assets/images/search-icon.png';
import ReportLogo from '../../assets/images/report-logo.png';
import PDFLogo from '../../assets/images/pdf-logo.png';
import msWordLogo from '../../assets/images/msword-logo.png';
import msExcelLogo from '../../assets/images/msexcel-logo.png';

interface searchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}

export default function InvoicesPage({searchTerm, setSearchTerm}: searchTermProps) {
    const [factory, setFactory] = useState('');
    const [invoiceList, setInvoiceList] = useState<invoice[]>([]);
    const [file, setFile] = useState<File[]>([]);
    const [preview, setPreview] = useState<string | null>(null);
    const [id, setId] = useState(0);
    const [invoiceSearch, setInvoiceSearch] = useState('');

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [invoiceList]);

    function saveInvoice() {
        const newId = id +1;
        setId(newId);
        const newInvoice:invoice = {
            id: newId,
            clientFactory: factory,
            uploadedBy: 'Super Admin',
            files: file
        }

        setInvoiceList(prev=> [...prev, newInvoice]);
        setFactory('');
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    // Filter invoices based on search term
    const filteredInvoices = invoiceList.filter((invoice) => {
        const search = invoiceSearch.toLowerCase();

        // Check factory name
        const matchesFactory = invoice.clientFactory.toLowerCase().includes(search);

        // Check file names and extensions
        const matchesFile = invoice.files.some((file) => {
            const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
            return (
                file.name.toLowerCase().includes(search) ||
                fileExtension.includes(search)
            );
        });

        return matchesFactory || matchesFile;
    });


    return(
        <div className="invoices-container reception-uploads-container">
            <title>Invoices</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="reception-uploads-search-container">
                <input
                    type="text"
                    placeholder="search documents..."
                    className="reception-uploads-search"
                    onChange={(event) => setInvoiceSearch(event.target.value)}
                />
                <img
                    className="reception-uploads-search-icon"
                    alt="search"
                    src={SearchIcon}
                />
            </div>
            <div className="invoices-list-container reception-uploads-list-container">
                <h3 
                    className="reception-uploads-header"
                    style={{display: invoiceList.length === 0 ? 'block' : 'none'}}
                >
                    Upload Invoice to get started
                </h3>
                {filteredInvoices.map((invoice)=> {
                    return(
                        <div className="invoices-card reception-uploads-card" key={invoice.id}>
                            <h3 className="reception-uploads-header">{invoice.clientFactory}</h3>
                            <p>
                                {invoice.files.map((file, index) => {
                                    const fileExtension = file.name.split('.').pop()?.toLowerCase();
                                    return <img 
                                        key={index} 
                                        src={fileExtension === 'pdf' ? PDFLogo :
                                            fileExtension === 'docx' ? msWordLogo :
                                            fileExtension === 'doc' ? msWordLogo :
                                            fileExtension === 'xlsx' ? msExcelLogo :
                                            fileExtension === 'xls' ? msExcelLogo :
                                            ReportLogo
                                        } 
                                        alt={file.name} 
                                        className="reception-uploads-document-preview"
                                    />;
                                })}
                            </p>
                            <p>
                                {invoice.files.map((file, index) => (
                                    <span key={index}>{file.name}</span>
                                ))}
                            </p>
                            <p>
                                {invoice.files.map((file, index) => {
                                    const url = URL.createObjectURL(file);
                                    return (
                                    <a key={index} href={url} download={file.name} className="report-uploads-download-file">
                                        Download File
                                    </a>
                                    );
                                })}
                            </p>
                            <p className="invoices-poster reception-uploads-poster">
                                posted by: Super Admin
                            </p>
                        </div>
                    )
                })}
            </div>
            <div ref={bottomRef}></div>
            <div className="invoices-input-container reception-input-container">
                <select title="selection" 
                    className="reception-input-select-factory" 
                    value={factory}
                    onChange={(event)=> {
                        setFactory(event.target.value)
                    }}
                >
                    <option value="" disabled>Select Factory</option>
                    <option value="NBC IKEJA">NBC IKEJA</option>
                    <option value="TGI Sagamu">TGI Sagamu</option>
                    <option value="Honeywell Sagamu">Honeywell Sagamu</option>
                </select>
                <input type="file" name="invoice" multiple 
                    className="reception-uploads-file" 
                    ref={fileInputRef} 
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                            setFile([file]);
                            setPreview(URL.createObjectURL(file));
                        }
                    }}
                />
                <button 
                    className="reception-uploads-button invoice-save-button"
                    onClick={saveInvoice}
                    disabled={!preview || !factory}
                >
                    Save
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