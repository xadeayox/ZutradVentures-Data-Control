import { Footer } from "../../components/Footer";
import { SearchBar } from "../../components/SearchBar"
import type { grn } from "../../interface/grn";
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

export default function GRNsPage({searchTerm, setSearchTerm}: searchTermProps) {
    const [factory, setFactory] = useState('');
    const [grnList, setGrnList] = useState<grn[]>([]);
    const [file, setFile] = useState<File[]>([]);
    const [preview, setPreview] = useState<string | null>(null);
    const [id, setId] = useState(0);
    const [grnSearch, setGrnSearch] = useState('');

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [grnList]);

    function saveGrn() {
        const newId = id + 1;
        setId(newId);
        const newGrn: grn = {
            id: newId,
            clientFactory: factory,
            uploadedBy: 'Super Admin',
            files: file
        }

        setGrnList(prev => [...prev, newGrn]);
        setFactory('');
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    // Filter GRNs based on search term
    const filteredGrns = grnList.filter((grn) => {
        const search = grnSearch.toLowerCase();

        const matchesFactory = grn.clientFactory.toLowerCase().includes(search);

        const matchesFile = grn.files.some((file) => {
            const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
            return (
                file.name.toLowerCase().includes(search) ||
                fileExtension.includes(search)
            );
        });

        return matchesFactory || matchesFile;
    });

    return (
        <div className="grns-container reception-uploads-container">
            <title>GRNs</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="reception-uploads-search-container">
                <input
                    type="text"
                    placeholder="search GRNs..."
                    className="reception-uploads-search"
                    onChange={(event) => setGrnSearch(event.target.value)}
                />
                <img
                    className="reception-uploads-search-icon"
                    alt="search"
                    src={SearchIcon}
                />
            </div>
            <div className="grns-list-container reception-uploads-list-container">
                <h3
                    className="reception-uploads-header"
                    style={{ display: grnList.length === 0 ? 'block' : 'none' }}
                >
                    Upload GRN to get started
                </h3>
                {filteredGrns.map((grn) => {
                    return (
                        <div className="grns-card reception-uploads-card" key={grn.id}>
                            <h3 className="reception-uploads-header">{grn.clientFactory}</h3>
                            <p>
                                {grn.files.map((file, index) => {
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
                                {grn.files.map((file, index) => (
                                    <span key={index}>{file.name}</span>
                                ))}
                            </p>
                            <p>
                                {grn.files.map((file, index) => {
                                    const url = URL.createObjectURL(file);
                                    return (
                                        <a key={index} href={url} download={file.name} className="report-uploads-download-file">
                                            Download File
                                        </a>
                                    );
                                })}
                            </p>
                            <p className="grns-poster reception-uploads-poster">
                                posted by: Super Admin
                            </p>
                        </div>
                    )
                })}
            </div>
            <div ref={bottomRef}></div>
            <div className="grns-input-container reception-input-container">
                <select title="selection"
                    className="reception-input-select-factory"
                    value={factory}
                    onChange={(event) => {
                        setFactory(event.target.value)
                    }}
                >
                    <option value="" disabled>Select Factory</option>
                    <option value="NBC IKEJA">NBC IKEJA</option>
                    <option value="TGI Sagamu">TGI Sagamu</option>
                    <option value="Honeywell Sagamu">Honeywell Sagamu</option>
                </select>
                <input type="file" name="grn" multiple 
                    ref={fileInputRef}
                    className="reception-uploads-file"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                            setFile([file]);
                            setPreview(URL.createObjectURL(file));
                        }
                    }}
                />
                <button
                    className="reception-uploads-button grn-save-button"
                    onClick={saveGrn}
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
