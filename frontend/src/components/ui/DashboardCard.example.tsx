import React from 'react';
import DashboardCard from './DashboardCard';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Example 1: User Card with all features
export const UserCardExample: React.FC = () => {
  return (
    <DashboardCard
      title="John Doe"
      value="Active"
      color="#2196f3"
      icon={<PersonIcon sx={{ fontSize: 21, color: '#fff' }} />}
      description="Senior Software Engineer"
      details={[
        { icon: <EmailIcon sx={{ fontSize: 14 }} />, label: 'Email', value: 'john@example.com' },
        { icon: <PhoneIcon sx={{ fontSize: 14 }} />, label: 'Phone', value: '+1234567890' }
      ]}
      actions={[
        { icon: <EditIcon fontSize="small" />, onClick: () => console.log('Edit user'), color: 'primary' },
        { icon: <DeleteIcon fontSize="small" />, onClick: () => console.log('Delete user'), color: 'error' },
        { icon: <VisibilityIcon fontSize="small" />, onClick: () => console.log('View user'), color: 'default' }
      ]}
      showToggle={true}
      toggleState={true}
      onToggleChange={(checked) => console.log('Toggle:', checked)}
      toggleLabel="Active"
    />
  );
};

// Example 2: Simple Stats Card (like LoadStats)
export const StatsCardExample: React.FC = () => {
  return (
    <DashboardCard
      title="Pending"
      value={15}
      color="#df9400"
      showChip={true}
    />
  );
};

// Example 3: Product Card with description only
export const ProductCardExample: React.FC = () => {
  return (
    <DashboardCard
      title="Premium Plan"
      value="$99"
      color="#4caf50"
      icon={<PersonIcon sx={{ fontSize: 21, color: '#fff' }} />}
      description="Best value for small teams"
      details={[
        { label: 'Users', value: '10' },
        { label: 'Storage', value: '100GB' }
      ]}
      actions={[
        { icon: <EditIcon fontSize="small" />, onClick: () => console.log('Edit product'), color: 'primary' }
      ]}
    />
  );
};

// Example 4: Minimal Card with just title and value
export const MinimalCardExample: React.FC = () => {
  return (
    <DashboardCard
      title="Revenue"
      value="$45,678"
      color="#9c27b0"
      showChip={false}
    />
  );
};
