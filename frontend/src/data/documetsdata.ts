const documentType = [
    {
        label: "Loads",
        value: "load"
    },
    {
        label: "Customers",
        value: "customer"
    },
    {
        label: "Carriers",
        value: "carrier"
    },
];

const carrierSubTypes = [
    { label: 'Documents', value: 'carrier' },
    { label: 'Drivers', value: 'driver' },
    { label: 'Insurance', value: 'carrierinsurance' },
];

const customerSubTypes = [
    { label: 'Documents', value: 'customer' },
    { label: 'Insurance', value: 'customerinsurance' },
];

const loadSubTypes = [
    { label: 'Documents', value: 'load' },
    { label: 'Customer Invoices', value: 'customerinvoice' },
    { label: 'Carrier Invoices', value: 'carrierinvoice' },
    { label: 'Delivery Checkout', value: 'deliverycheckout' },
    { label: 'Pickup Checkout', value: 'pickupcheckout' },
    { label: 'Expense', value: 'expense' },
];

export {documentType,carrierSubTypes,customerSubTypes,loadSubTypes}