import React from 'react';
import apiService from '@/service/apiService';
import { ICarrier } from '@/types';
import { getAllDataOfBillCustomers } from '@/utils/getAllDataByApi';
import { withPermission } from '@/hooks/authUtils';
import CreateRecievedPaymentPage from '@/components/common/PaymentReceived/CreateRecievedPaymentPage';

const getDisplayName = (vendor: ICarrier) => vendor?.company || '';

const RecievedPayment = () => (
  <CreateRecievedPaymentPage
    documentType="bills"
    pageTitle="Bill Payment"
    outstandingLabel="Outstanding Bills"
    customerLabel="Vendor"
    depositToLabel="Paid From"
    amountLabel="Amount Paid"
    searchLabel="Find by Bill No."
    tooltipText="Enter bill number to filter bills"
    getDisplayName={getDisplayName}
    getCustomersQueryFn={() => getAllDataOfBillCustomers() as Promise<ICarrier[]>}
    getDocumentsByCustomerQueryFn={(params) => apiService.getBillCustomerById(params)}
    customersQueryKey="getBillCustomers"
    documentsQueryKey="getBillCustomerById"
    searchParamKey="BillNumber"
    successMessage="Bill payment has been created successfully!"
  />
);

export default withPermission('create', ["accounting"])(RecievedPayment);
