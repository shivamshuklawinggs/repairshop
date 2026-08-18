import moment from "moment";
export const Dashboardtoday = moment(new Date());
export const LastMonth = moment().subtract(1, 'months');
export const dateFilterOptions = [
  {
    label: "Last Month",
    value: LastMonth,
  },
  {
    label: "Last 3 Months",
    value:moment().subtract(3, 'months')
  },
  {
    label: "Last 6 Months",
    value: moment().subtract(6, 'months')
  },
  {
    label: "Current Year",
    value: moment().startOf('year'),
  },
  {
    label: "Last Year",
    value: moment().subtract(1, 'year').startOf('year'),
  },
  {
    label: "Custom",
    value: "custom",
  },
];
