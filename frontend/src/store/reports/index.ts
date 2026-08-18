import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import moment from 'moment';

export interface ReportState {
  reportPeriod: string;
  fromDate: Date;
  toDate: Date;
  customerId?: string;
}

const initialState: ReportState = {
  reportPeriod: 'this_year_to_date',
  fromDate: moment().startOf('year').toDate(),
  toDate: moment().endOf("day").toDate(),
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setReportPeriod: (state, action: PayloadAction<string>) => {
      state.reportPeriod = action.payload;

      if (action.payload === 'this_year_to_date') {
        state.fromDate = moment().startOf('year').toDate();
        state.toDate = moment().endOf("day").toDate();
      }
    },
    setFromDate: (state, action: PayloadAction<Date>) => {
      state.fromDate = action.payload;
    },
    setToDate: (state, action: PayloadAction<Date>) => {
      state.toDate = action.payload;
    },
    setCustomerId: (state, action: PayloadAction<string | undefined>) => {
      state.customerId = action.payload;
    },
  
    setFilters: (state, action: PayloadAction<Partial<ReportState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setReportPeriod,
  setFromDate,
  setToDate,
  setCustomerId,
  setFilters,
} = reportSlice.actions;

export default reportSlice.reducer;
