import React from 'react';
import apiService from '@/service/apiService';
import { ICustomer } from '@/types';
import { getAllDataOfCustomers } from '@/utils/getAllDataByApi';
import { withPermission } from '@/hooks/authUtils';
import CreateRecievedPaymentPage from '@/components/common/PaymentReceived/CreateRecievedPaymentPage';

const getDisplayName = (customer: ICustomer) => customer?.company || customer?.displayCustomerName || '';

const RecievedPayment = () => (
  <CreateRecievedPaymentPage
    documentType="invoices"
    pageTitle="Receive Payment"
    outstandingLabel="Outstanding Invoices"
    customerLabel="Customer"
    depositToLabel="Received In"
    amountLabel="Amount Received"
    searchLabel="Find by Invoice No."
    tooltipText="Enter invoice number to filter invoices"
    getDisplayName={getDisplayName}
    getCustomersQueryFn={() => getAllDataOfCustomers() as Promise<ICustomer[]>}
    getDocumentsByCustomerQueryFn={(params) => apiService.getInvoiceCustomersById(params)}
    customersQueryKey="getInvoiceCustomers"
    documentsQueryKey="getInvoiceCustomersById"
    searchParamKey="invoiceNumber"
    successMessage="Payment has been created successfully!"
  />
);

export default withPermission('create', ['accounting'])(RecievedPayment);
