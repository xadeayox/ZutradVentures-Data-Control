import { Administrator } from "../../components/Administrator";
import { Maintenance } from "../../components/Maintenance";
import { Reports } from "../../components/Reports";
import { Supply } from "../../components/Supply";
import { SearchBar } from "../../components/SearchBar";
import { useEffect, useState } from "react";
import { StoreInput } from "./StoreInput";
import './Store.css';
import { StoreContent } from "./StoreContent";
import type { StoreData } from "./storeTypes";
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

export default function StorePage({ searchTerm, setSearchTerm }: SearchTermProps) {
    const [toggleInput, setToggleInput] = useState(false);
    const [macsaStore, setMacsaStore] = useState<StoreData[]>([]);
    const [savemaStore, setSavemaStore] = useState<StoreData[]>([]);
    const [sojetStore, setSojetStore] = useState<StoreData[]>([]);
    const [bestCodeStore, setBestCodeStore] = useState<StoreData[]>([]);

    useEffect(() => {
        fetchStore();
    }, []);

    async function fetchStore() {
        try {
            const response = await apiFetch('/api/store');
            const data = await response.json();
            if (response.ok) {
                setMacsaStore(data.grouped['Macsa ID'] || []);
                setSavemaStore(data.grouped['Savema'] || []);
                setSojetStore(data.grouped['Sojet'] || []);
                setBestCodeStore(data.grouped['BestCode'] || []);
            }
        } catch (err) {
            console.error('Failed to fetch store:', err);
        }
    }

    function toggleInputDisplay() {
        setToggleInput(prev => !prev);
    }

    return (
        <div className="store-page-container">
            <title>Store</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <section className="store-content-with-input">
                <StoreContent
                    macsaStore={macsaStore}
                    savemaStore={savemaStore}
                    sojetStore={sojetStore}
                    bestCodeStore={bestCodeStore}
                />
                <div className="toggle-input-container-store">
                    <img
                        className="toggle-input-store"
                        src={toggleInput ? ArrowDown : ArrowUp}
                        title={toggleInput ? 'hide inputs' : 'show inputs'}
                        onClick={toggleInputDisplay}
                    />
                </div>
                <StoreInput
                    toggleInput={toggleInput}
                    onItemAdded={fetchStore}
                />
            </section>
            <HamBurgerLinks />
            <Administrator />
            <Reports />
            <Supply />
            <Maintenance />
            <Clients />
            <Footer />
        </div>
    );
}
