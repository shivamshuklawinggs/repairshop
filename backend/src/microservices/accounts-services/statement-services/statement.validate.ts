import * as yup from 'yup';

export const StatementSchema = yup.object().shape({
    data:yup.array().of(yup.object().shape({
        _id: yup.string().required('ID is required'),
        invoiceNumber: yup.string().required('Invoice Number is required'),
        status: yup.string().required('Status is required'),
        invoiceDate: yup.string().required('Invoice Date is required'),
        dueDate: yup.string().required('Due Date is required'),
        recievedAmount: yup.number().required('Recieved Amount is required'),
        totalAmount: yup.number().required('Total Amount is required'),
        balanceDue: yup.number().required('Balance Due is required'),
    })),
    customerId: yup.string().required('Customer ID is required'),
    account:yup.boolean().required('Account is required'),
    totalBalance: yup.number().required('Total Balance is required'),
    totalRecievedAmount: yup.number().required('Total Recieved Amount is required'),
    totalBalanceDue: yup.number().required('Total Balance Due is required'),
})
