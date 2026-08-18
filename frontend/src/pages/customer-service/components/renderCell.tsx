import React from 'react'
import {  IPaymentTerm } from '@/types'
import {Typography, TableCell, Stack, Box, Rating } from '@mui/material'
import {  formatCurrency, truncateText, getFullName, addressformat } from '@/utils';

import { IAccountsCustomerView } from '@/types';
import getStatusBadge from '@/components/common/getStatusBadge';
import { renderDefaultCellValue } from '@/utils/renderDefaultCellValue';
import { NavigateFunction } from 'react-router-dom';
interface renderCellProps {
    column: string;
    customer: Omit<IAccountsCustomerView, 'paymentTerms'> & {
        paymentTerms: IPaymentTerm;
    };
    navigate: NavigateFunction;
}

const renderCell = ({ column, customer,navigate }: renderCellProps) => {
    const columnRenderers: Record<string, () => React.ReactNode> = {
        name: () => (
            <Typography title={getFullName(customer)} className='tellipsis' fontSize={{xs:13, md:14}}>{getFullName(customer)}</Typography>
        ),
        company: () => (
            <Typography title={customer.company} className='tellipsis' fontSize={{xs:13, md:14}}>{customer.company || "N/A"}</Typography>
        ),
        displayCustomerName: () => (
            <Typography title={customer.displayCustomerName ||customer?.company || "N/A"} className='tellipsis' fontSize={{xs:13, md:14}}>{customer.displayCustomerName ||customer?.company || "N/A"}</Typography>
        ),
        email: () => (
            <Typography title={customer.email} className='tellipsis' fontSize={{xs:13, md:14}}>{customer.email || "N/A"}</Typography>
        ),
        phone: () => (
            <Typography fontSize={{xs:13, md:14}}>{customer.phone || "N/A"}</Typography>
        ),
        mobileNo: () => (
            <Typography fontSize={{xs:13, md:14}}>{customer.mobileNo || "N/A"}</Typography>
        ),
        billingAddress: () => (
            // <Stack spacing={0}>
            //     <Typography className='tellipsis' fontSize={{xs:13, md:14}} title={customer?.billingAddress?.address}>{truncateText(customer?.billingAddress?.address)}</Typography>
            //     <Typography className='tellipsis' fontSize={{xs:13, md:14}}>{`${customer?.billingAddress?.city}, ${customer.billingAddress?.state} ${customer?.billingAddress?.zipCode}`}</Typography>
            // </Stack>
            <Stack spacing={0}>
                <Typography
                    className="tellipsis"
                    fontSize={{xs:13, md:14}}
                    title={addressformat({billingAddress:customer?.billingAddress})}
                >
                    {truncateText(addressformat({billingAddress:customer?.billingAddress}))  || "N/A"}
                </Typography>
            </Stack>
        ),
        shippingAddress: () => (
            // <Stack spacing={0}>
            //     <Typography className='tellipsis' fontSize={{xs:13, md:14}} title={customer?.shippingAddress?.address}>{truncateText(customer?.shippingAddress?.address)}</Typography>
            //     <Typography className='tellipsis' fontSize={{xs:13, md:14}}>{`${customer?.shippingAddress?.city}, ${customer?.shippingAddress?.state} ${customer?.shippingAddress?.zipCode}`}</Typography>
            // </Stack>
            <Stack spacing={0}>
            <Typography
                className="tellipsis"
                fontSize={{xs:13, md:14}}
                title={addressformat({billingAddress:customer?.shippingAddress})}
            >
              {truncateText(addressformat({billingAddress:customer?.shippingAddress}))  || "N/A"}
            </Typography>
            </Stack>
        ),
        id: () => (
            <Typography fontSize={12.6} sx={{color:'#0061ff', fontWeight:'600', letterSpacing:'0.5px'}}>{customer.id || "N/A"}</Typography>
        ),
        paymentTerms: () => (
            <Typography
                className='tellipsis'
                fontSize={{xs:13, md:14}}
                title={
                    typeof customer?.paymentTerms === 'object'
                        ? `${customer?.paymentTerms?.name} (${customer?.paymentTerms?.days} days)`
                        : 'N/A'
                }
            >
            {typeof customer?.paymentTerms === 'object' ? `${customer?.paymentTerms?.name} (${customer?.paymentTerms?.days} days)` || "N/A" : 'N/A'}
            </Typography>
        ),
        paymentMethod: () => (
            <Typography fontSize={{xs:13, md:14}}>
                {typeof customer?.paymentMethod === 'string' ? customer?.paymentMethod || "N/A" : 'N/A'}
            </Typography>
        ),
        balanceDue: () => formatCurrency(customer.balanceDue || 0),
        status: () => (
            getStatusBadge(customer.status || 'inactive')
        ),
         rating: () => (
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/customers/rating/${customer._id}`)}>
                    <Rating precision={0.1}  value={customer?.stars || 0.0} readOnly size='small' />
                    {/* <Typography fontSize={12.5} sx={{ ml: 1, color: 'primary.main', fontWeight: 'medium', textDecoration:'underline' }}>
                    View Details
                    </Typography> */}
                </Box>
        ),
        fax: () => (
            <Typography fontSize={{xs:13, md:14}}>{customer.fax || "N/A"}</Typography>
        ),
        other: () => (
            <Typography title={customer.other} className='tellipsis' fontSize={{xs:13, md:14}}>{customer.other || "N/A"}</Typography>
        ),
        website: () => (
            <Typography title={customer.website} className='tellipsis' fontSize={{xs:13, md:14}}>{customer.website || "N/A"}</Typography>
        ),
        nameToPrintOnCheck: () => (
            <Typography title={customer.nameToPrintOnCheck} className='tellipsis' fontSize={{xs:13, md:14}}>{customer.nameToPrintOnCheck || "N/A"}</Typography>
        ),
        isSubCustomer: () => (
            <Typography fontSize={{xs:13, md:14}}>{customer.isSubCustomer?"Yes":"No"}</Typography>
        ),
        parentCustomer: () => (
            <Typography fontSize={{xs:13, md:14}}>{customer?.parentCustomer?.displayCustomerName || "N/A"}</Typography>
        ),
        notes: () => (
            <Typography title={customer.notes} className='tellipsis' fontSize={{xs:13, md:14}}>{customer.notes || "N/A"}</Typography>
        ),
        default:()=>renderDefaultCellValue(customer[column as keyof IAccountsCustomerView])
    }
    // Get the renderer for the column, fallback to default
    const renderer = columnRenderers[column] || columnRenderers.default;
    const result = renderer();

    return (
            React.isValidElement(result) || typeof result === 'string' || typeof result === 'number'
            ? result
            : 'Invalid content'
    );
};

export default renderCell