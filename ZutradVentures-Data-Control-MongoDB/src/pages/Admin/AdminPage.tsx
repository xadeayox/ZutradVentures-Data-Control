import { Footer } from "../../components/Footer";
import { SearchBar } from "../../components/SearchBar";
import { CreateUser } from "./CreateUser";
import { Maintenance } from "./Maintenance";
import { SpecialRoles } from "./SpecialRoles";
import { ViewReports } from "./ViewReports";
import { Supply } from "./Supply";
import { Store } from "../../components/Store";
import './AdminPage.css';
import { Clients } from "../../components/Clients";
import { AddClient } from "./AddClient";
import { HamBurgerLinks } from "../../components/HamBurgerLinks";

interface searchTermProps {
    searchTerm: string,
    setSearchTerm: (term: string) => void,
}

export default function AdminPage({searchTerm, setSearchTerm}: searchTermProps) {
    return (
        <div className="admin-page-container">
            <title>Administrator</title>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <Store />
            <main className="admin-page-contents">
                <div className="first-half-content">
                    <CreateUser />
                    <SpecialRoles />
                    <AddClient />
                </div>
                <div className="second-half-content">
                    
                    <ViewReports />
                    <Supply />
                    <Maintenance />
                </div>
            </main>
            <HamBurgerLinks />
            <Clients />
            <Footer />
        </div>
    );
}