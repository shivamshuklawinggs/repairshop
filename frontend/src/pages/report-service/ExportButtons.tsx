import React from 'react';
import { Button, ButtonGroup, Tooltip, Box, Typography } from "@mui/material";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import apiService from '@/service/apiService';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { formatDate } from '@/utils/dateUtils';
import { Reporttitle } from './constant';
import { allowedreports } from '@/types';

interface ExportButtonsProps {
    reportType: allowedreports;
    reportData: any;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ reportType, reportData }) => {
    const filters = useSelector((state: RootState) => state.report);

    const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
        try {
            const params: { type: string; fromDate?: Date; toDate?: Date; allowedType?: string; format?: string } = {
                type: reportType,
                format: format
            }
            if(filters.fromDate) params.fromDate=filters.fromDate
            if(filters.toDate) params.toDate=filters.toDate

            const reportTitle = Reporttitle[reportType as keyof typeof Reporttitle] || 'Report';
            const fileName = `${reportTitle.replace(/\s+/g, '_')}_${formatDate(filters.fromDate)}_to_${formatDate(filters.toDate)}.${format}`;

            if (format === 'pdf' || format === 'csv') {
                // For PDF and CSV, we need to download as blob
                const response = await apiService.exportReportBlob(params);
                const blob = new Blob([response], {
                    type: format === 'pdf' ? 'application/pdf' : 'text/csv'
                });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(url);
            } else {
                // For JSON, handle as regular response
                const response = await apiService.exportReport(params);
                const jsonString = JSON.stringify(response.data, null, 2);
                const blob = new Blob([jsonString], {
                    type: 'application/json'
                });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center', justifyContent: {xs:'flex-start', md:'flex-end'} }}>
            <ButtonGroup
                variant="contained"
                size="small"
                sx={{
                    boxShadow:'none',
                    border:'1px solid #ddd',
                    borderRadius:'6px',
                    '& .MuiButton-root': {
                        backgroundColor: '#fff',
                        color: 'text.primary',
                        borderColor: '#ddd',
                    }
                }}
            >
                <Tooltip title="Export as CSV">
                    <Button
                        startIcon={<FileDownloadIcon sx={{ fontSize: '14px', color:'#696981' }} />}
                        onClick={() => handleExport('csv')}
                        disabled={!reportData}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '13px',
                            px: 1.5,
                            '& .MuiButton-startIcon': {
                                marginRight: '3px',
                            },
                        }}
                    >
                        CSV
                    </Button>
                </Tooltip>
                <Tooltip title="Export as JSON">
                    <Button
                        startIcon={<FileDownloadIcon sx={{ fontSize: '14px', color:'#696981' }} />}
                        onClick={() => handleExport('json')}
                        disabled={!reportData}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '13px',
                            px: 1.5,
                            '& .MuiButton-startIcon': {
                                marginRight: '3px',
                            },
                        }}
                    >
                        JSON
                    </Button>
                </Tooltip>
                <Tooltip title="Export as PDF">
                    <Button
                        startIcon={<FileDownloadIcon sx={{ fontSize: '14px', color:'#696981' }} />}
                        onClick={() => handleExport('pdf')}
                        disabled={!reportData}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '13px',
                            px: 1.5,
                            '& .MuiButton-startIcon': {
                                marginRight: '3px',
                            },
                        }}
                    >
                       PDF
                    </Button>
                </Tooltip>
            </ButtonGroup>
        </Box>
    );
};

export default ExportButtons;