  // Chart data
  const expensesData = [
    { id: 0, value: 35, name: 'Fuel', color: '#344BFD' },
    { id: 1, value: 25, name: 'Maintenance', color: '#F4A79D' },
    { id: 2, value: 20, name: 'Insurance', color: '#F68D2B' },
    { id: 3, value: 20, name: 'Truck Wash', color: '#FFD200' },
  ];

  const incomeData = [
    { id: 0, value: 40, name: 'Freight', color: '#344BFD' },
    { id: 1, value: 30, name: 'Contracts', color: '#F4A79D' },
    { id: 2, value: 30, name: 'Other', color: '#F68D2B' },
  ];

  const receivablesData = [
    { id: 0, value: 60, name: 'Current', color: '#7FD000' },
    { id: 1, value: 25, name: '1-2 months', color: '#F4A79D' },
    { id: 2, value: 15, name: '>3 months', color: '#FFD200' },
  ];

  const payablesData = [
    { id: 0, value: 50, name: 'Current', color: '#7FD000' },
    { id: 1, value: 30, name: '1-2 months', color: '#F4A79D' },
    { id: 2, value: 20, name: '>3 months', color: '#FFD200' },
  ];
 const dataset = [
  { date: 'Jan 26', sales: 1000 },
  { date: 'Jan 27', sales: 1900 },
  { date: 'Feb 03', sales: 0 },
  { date: 'Feb 10', sales: 50 },
  { date: 'Feb 17', sales: 50 },
  { date: 'Feb 24', sales: 50 },
];
//  add lengend data also for recharts
const legendData = [
  { label: 'current', amount: '$0.00', color: '#8BC34A' },
  { label: '2 - 6 months', amount: '$33,860.82', color: '#FF8A65' },
  { label: '>6 months', amount: '$33,860.82', color: '#FDD835' }
];

  export { expensesData, incomeData, receivablesData, payablesData,dataset ,legendData};