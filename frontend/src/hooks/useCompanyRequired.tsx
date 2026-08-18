import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export const useCompanyRequired = () => {
  const { currentCompany } = useSelector((state: RootState) => state.user);
  return { hasCompany: !!currentCompany };
};
