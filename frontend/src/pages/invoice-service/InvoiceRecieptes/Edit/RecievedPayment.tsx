import React from 'react';
import { withPermission } from '@/hooks/authUtils';
import EditRecievedPaymentPage from '@/components/common/PaymentReceived/EditRecievedPaymentPage';
import apiService from '@/service/apiService';

const RecievedPayment = () => (
  <EditRecievedPaymentPage
    documentType="invoices"
    pageTitle="Edit Receive Payment"
    outstandingLabel="Outstanding Invoices"
    customerLabel="Customer"
    depositToLabel="Received In"
    amountLabel="Amount Received"
    searchLabel="Find by Invoice No."
    getDocumentsByCustomerQueryFn={(params) => apiService.getInvoiceCustomersById(params)}
    documentsQueryKey="getInvoiceCustomersById"
  />
);

export default withPermission('update', ['accounting'])(RecievedPayment);
