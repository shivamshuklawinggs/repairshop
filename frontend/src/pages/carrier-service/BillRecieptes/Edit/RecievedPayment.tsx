import React from 'react';
import { withPermission } from '@/hooks/authUtils';
import EditRecievedPaymentPage from '@/components/common/PaymentReceived/EditRecievedPaymentPage';
import apiService from '@/service/apiService';

const RecievedPayment = () => (
  <EditRecievedPaymentPage
    documentType="bills"
    pageTitle="Edit Bill Payment"
    outstandingLabel="Outstanding Bills"
    customerLabel="Vendor"
    depositToLabel="Paid From"
    amountLabel="Amount Paid"
    searchLabel="Find by Bill No."
    getDocumentsByCustomerQueryFn={(params) => apiService.getBillCustomerById(params)}
    documentsQueryKey="getBillCustomerById"
  />
);

export default withPermission('update', ['accounting'])(RecievedPayment);
