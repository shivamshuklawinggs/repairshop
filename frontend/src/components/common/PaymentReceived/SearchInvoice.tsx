import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import { useFormContext } from 'react-hook-form';

interface SearchInvoiceProps {
    isLoading: boolean;
    size?: 'small' | 'medium';
    label?: string;
}

const SearchInvoice: React.FC<SearchInvoiceProps> = ({
    isLoading,
    size = 'medium',
    label = 'Find by No.'
}) => {
    const { setValue, watch } = useFormContext<any>();
    const searchInvoice = watch("searchInvoice");

    return (
        <TextField size='small'
            fullWidth
            label={label}
            value={searchInvoice || ''}
            onChange={(e) => {
                setValue('searchInvoice', e.target.value);
            }}
            disabled={isLoading}
            placeholder="Type to search..."
            InputProps={{
                endAdornment: searchInvoice && (
                    <InputAdornment position="end">
                        <IconButton
                            size="small"
                            onClick={() => setValue('searchInvoice', '')}
                        >
                            <ClearIcon />
                        </IconButton>
                    </InputAdornment>
                )
            }}
        />
    );
};

export default SearchInvoice;
