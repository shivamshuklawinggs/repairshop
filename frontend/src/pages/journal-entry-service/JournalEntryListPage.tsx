import React from 'react';
import JournalEntryList from './JournalEntryList';
import { withPermission } from '@/hooks/authUtils';

const JournalEntryListPage: React.FC = () => {
  return <JournalEntryList />;
};

export default withPermission("view", ["accounting"])(JournalEntryListPage);
