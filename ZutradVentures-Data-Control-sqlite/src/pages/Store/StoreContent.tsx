import MacsaIdImage from '../../assets/images/macsa-id-laser.png';
import SavemaImage from '../../assets/images/savema-printer.png';
import SojetImage from '../../assets/images/sojet-handheld-printer.png';
import BestCodeImage from '../../assets/images/bestcode-printer.png';
import type { StoreData } from './storeTypes';
import { Link } from 'react-router';

interface StoreContentProps {
    macsaStore: StoreData[];
    savemaStore: StoreData[];
    sojetStore: StoreData[];
    bestCodeStore: StoreData[];
}

export function StoreContent({ macsaStore, savemaStore, sojetStore, bestCodeStore }: StoreContentProps) {
    const macsaThree = macsaStore.slice(0, 3);
    const savemaThree = savemaStore.slice(0, 3);
    const sojetThree = sojetStore.slice(0, 3);
    const bestCodeThree = bestCodeStore.slice(0, 3);

    function renderItems(items: StoreData[]) {
        return items.map((item) => (
            <details key={item.partNumber}>
                <summary>{item.machinePart}</summary>
                Part Number: {item.partNumber}
                <br />
                Quantity: {item.quantity}
                <div className="store-date-updated">
                    Date Updated: {new Date(item.updatedAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    })}
                </div>
            </details>
        ));
    }

    return (
        <>
            <div className="store-content">
                <section className="store-machine-card">
                    <h3>Macsa ID</h3>
                    <div className="store-machine-card-contents">
                        <div>{renderItems(macsaThree)}</div>
                        <img src={MacsaIdImage} title="Macsa ID Laser Coder" className="store-machine-image" />
                    </div>
                    <Link to="/store/macsa-store" className="see-all-parts-store-link">See all Parts</Link>
                </section>
                <section className="store-machine-card">
                    <h3>Savema</h3>
                    <div className="store-machine-card-contents">
                        <div>{renderItems(savemaThree)}</div>
                        <img src={SavemaImage} title="Savema TTO Printer" className="store-machine-image store-machine-image-savema" />
                    </div>
                    <Link to="/store/savema-store" className="see-all-parts-store-link">See all Parts</Link>
                </section>
                <section className="store-machine-card">
                    <h3>Sojet</h3>
                    <div className="store-machine-card-contents">
                        <div>{renderItems(sojetThree)}</div>
                        <img src={SojetImage} title="Sojet Handheld printer" className="store-machine-image" />
                    </div>
                    <Link to="/store/sojet-store" className="see-all-parts-store-link">See all Parts</Link>
                </section>
                <section className="store-machine-card">
                    <h3>BestCode</h3>
                    <div className="store-machine-card-contents">
                        <div>{renderItems(bestCodeThree)}</div>
                        <img src={BestCodeImage} title="BestCode CIJ" className="store-machine-image store-machine-image-bestcode" />
                    </div>
                    <Link to="/store/bestcode-store" className="see-all-parts-store-link">See all Parts</Link>
                </section>
            </div>
        </>
    );
}
