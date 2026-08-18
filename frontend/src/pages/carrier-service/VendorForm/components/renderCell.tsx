import React from 'react'
import { ICarrier } from '@/types'
import {  Typography,  TableCell, Stack, Box, Rating } from '@mui/material'
import { truncateText,getFullName } from '@/utils';
import getStatusBadge from '@/components/common/getStatusBadge';
import { renderDefaultCellValue } from '@/utils/renderDefaultCellValue';
import { NavigateFunction } from 'react-router-dom';
interface renderCellProps {
    column: string;
    vendor: ICarrier;
    navigate: NavigateFunction;
}

const renderCell = ({ column, vendor,navigate }: renderCellProps) => {
    const columnRenderers: Record<string, () => React.ReactNode> = {
        name: () => (
            <Typography title={getFullName(vendor)}  className='tellipsis' fontSize={{xs:13, md:14}}>{getFullName(vendor)}</Typography>
        ),
        company: () => (
            <Typography title={vendor?.company} className='tellipsis' fontSize={{xs:13, md:14}}>{vendor?.company || vendor?.company || "N/A"}</Typography>
        ),
        displayCustomerName: () => (
            <Typography title={vendor?.displayCustomerName} className='tellipsis' fontSize={{xs:13, md:14}}>{vendor?.displayCustomerName || vendor?.company || "N/A"}</Typography>
        ),
        email: () => (
            <Typography title={vendor.email} className='tellipsis' fontSize={{xs:13, md:14}}>{vendor.email || "N/A"}</Typography>
        ),
        phone: () => (
            <Typography fontSize={{xs:13, md:14}}>{vendor.phone || "N/A"}</Typography>
        ),
        mobileNo: () => (
            <Typography fontSize={{xs:13, md:14}}>{vendor.mobileNo || "N/A"}</Typography>
        ),
        billingAddress: () => (
            <Stack spacing={0}>
                <Typography fontSize={{xs:13, md:14}} title={vendor?.billingAddress?.address}>{truncateText(vendor?.billingAddress?.address || 'N/A')}</Typography>
            </Stack>
        ),
        shippingAddress: () => (
            <Stack spacing={0}>
                <Typography fontSize={{xs:13, md:14}} title={vendor?.shippingAddress?.address}>{truncateText(vendor?.shippingAddress?.address || 'N/A')}</Typography>
            </Stack>
        ),

        paymentMethod: () => (
            <Typography fontSize={{xs:13, md:14}}>
                {typeof vendor?.paymentMethod === 'string' ? vendor?.paymentMethod || "N/A" : 'N/A'}
            </Typography>
        ),
        status: () => (
            getStatusBadge(vendor.status || 'inactive', {
              fontWeight: 500, fontSize: '12px', ml: 0, borderRadius: 2,
              textTransform: 'capitalize', '& .MuiChip-label': { px: 1 }
            })
        ),
        rating: () => (
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/carriers/rating/${vendor._id}`)}>
                <Rating precision={0.1} value={vendor?.stars || 0.0} readOnly size='small'/>
                {/* <Typography fontSize={12.5} sx={{ ml: 1, color: 'primary.main', fontWeight: 'medium', textDecoration:'underline' }}>
                View Details
                </Typography> */}
            </Box>
        ),
        fax: () => (
            <Typography fontSize={{xs:13, md:14}}>{vendor.fax || "N/A"}</Typography>
        ),
        id: () => (
            <Typography fontSize={12.6} sx={{color:'#0061ff', fontWeight:'600',letterSpacing:'0.5px'}}>{vendor.id || "N/A"}</Typography>
        ),
        other: () => (
            <Typography title={vendor.other} className='tellipsis' fontSize={{xs:13, md:14}}>{vendor.other || "N/A"}</Typography>
        ),
        website: () => (
            <Typography title={vendor.website} className='tellipsis' fontSize={{xs:13, md:14}}>{vendor.website || "N/A"}</Typography>
        ),
        nameToPrintOnCheck: () => (
            <Typography title={vendor.nameToPrintOnCheck} className='tellipsis' fontSize={{xs:13, md:14}}>{vendor.nameToPrintOnCheck || "N/A"}</Typography>
        ),
        notes: () => (
            <Typography title={vendor.notes} className='tellipsis' fontSize={{xs:13, md:14}}>{vendor.notes || "N/A"}</Typography>
        ),
        paymentTerms: () => (
            <Typography fontSize={{xs:13, md:14}}>{vendor.paymenttermsdata?.name || "N/A"}</Typography>
        ),

        // documents: () => (
        //     <Typography variant="body2">{customer.documents}</Typography>
        // ),
       default:()=>renderDefaultCellValue(vendor[column as keyof ICarrier])
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