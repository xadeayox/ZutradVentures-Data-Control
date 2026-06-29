import { useEffect, useState } from "react";
import { Footer } from "../../../components/Footer";
import { MainStoreNavLink } from "../../../components/MainStoreNavLink";
import { SearchBar } from "../../../components/SearchBar";
import type { StoreData } from "../storeTypes";
import { StoreItems } from "../StoreItems";
import '../ComponentStores.css';
import { apiFetch } from "../../../api";

interface SearchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}

export default function BestCodeStorePage({ searchTerm, setSearchTerm }: SearchTermProps) {
    const [items, setItems] = useState<StoreData[]>([]);

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        try {
            const response = await apiFetch(`/api/store/${encodeURIComponent('BestCode')}`);
            const data = await response.json();
            if (response.ok) setItems(data.items);
        } catch (err) {
            console.error('Failed to fetch BestCode store:', err);
        }
    }

    const filtered = items.filter(item =>
        item.machinePart.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="store-items-page-container">
            <title>BestCode Store</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <MainStoreNavLink />
            <div className="store-items-container">
                {filtered.map(item => (
                    <StoreItems
                        key={item._id}
                        storeItem={item}
                        onUpdate={fetchItems}
                        onDelete={fetchItems}
                    />
                ))}
            </div>
            <Footer />
        </div>
    );
}
