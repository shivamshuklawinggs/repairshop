import React, { useState } from 'react';
import { Box, Tab, Tabs, Container } from '@mui/material';
import { useParams } from 'react-router-dom';
import JournalEntryForm from './index';
import JournalEntryList from './JournalEntryList';
import { withPermission } from '@/hooks/authUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`journal-entry-tabpanel-${index}`}
      aria-labelledby={`journal-entry-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 1 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `journal-entry-tab-${index}`,
    'aria-controls': `journal-entry-tabpanel-${index}`,
  };
}

const JournalEntryMain: React.FC = () => {
  const { JournalEntryId } = useParams<{ JournalEntryId?: string }>();
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // If we have an ID, show the form tab
  React.useEffect(() => {
    if (JournalEntryId) {
      setTabValue(0);
    }
  }, [JournalEntryId]);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleChange} aria-label="journal entry tabs">
          <Tab label="Create/Edit Journal Entry" {...a11yProps(0)} />
          <Tab label="Journal Entries List" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <JournalEntryForm />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <JournalEntryList onEdit={(entry) => {
          // Navigate to edit mode and switch to form tab
          window.location.href = `/journal-entry/${entry._id}`;
        }} />
      </TabPanel>
    </Container>
  );
};

export default withPermission("view", ["accounting"])(JournalEntryMain);
