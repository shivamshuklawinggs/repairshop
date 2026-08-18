import React from 'react';
import { useParams } from 'react-router-dom';
import UnifiedReport from '@/components/common/UnifiedReport';

const CarrierReport: React.FC = () => {
  const { carrierId = "" } = useParams<{ carrierId: string }>();

  return (
    <UnifiedReport
      entityId={carrierId}
      entityType="carrier"
    />
  );
};

export default CarrierReport;
