export default function PurchaseOrdersPage() {
    return(
        <div className="invoices-container">
            <div className="invoices-list">

            </div>
            <div className="invoices-input">
                <select title="selection">
                    <option value="">Select Factory</option>
                    <option value="NBC IKEJA">NBC IKEJA</option>
                    <option value="TGI Sagamu">TGI Sagamu</option>
                    <option value="Honeywell Sagamu">Honeywell Sagamu</option>
                </select>
            </div>
        </div>
    );
}