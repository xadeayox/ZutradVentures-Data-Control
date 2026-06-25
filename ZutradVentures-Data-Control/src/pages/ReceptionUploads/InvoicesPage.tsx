import { Footer } from "../../components/Footer";
import { SearchBar } from "../../components/SearchBar"

interface searchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}

export default function InvoicesPage({searchTerm, setSearchTerm}: searchTermProps) {
    return(
        <div className="invoices-container reception-uploads-container">
            <title>Invoices</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            <div className="invoices-list reception-uploads-list">
                
            </div>
            <div className="invoices-input reception-input">
                <select title="selection">
                    <option value="" disabled>Select Factory</option>
                    <option value="NBC IKEJA">NBC IKEJA</option>
                    <option value="TGI Sagamu">TGI Sagamu</option>
                    <option value="Honeywell Sagamu">Honeywell Sagamu</option>
                </select>
                <input type="file" name="invoice" multiple/>
            </div>
            <Footer />
        </div>
    );
}