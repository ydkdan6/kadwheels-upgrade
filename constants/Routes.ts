export const CAMPUSES = [
  'Ugwuan Rimi',
  'Main Campus',
  'Sabo',
  'Barnawa'
];

export const ROUTES = [
  { from: 'Ugwuan Rimi', to: 'Main Campus' },
  { from: 'Main Campus', to: 'Ugwuan Rimi' },
  { from: 'Main Campus', to: 'Sabo' },
  { from: 'Sabo', to: 'Main Campus' },
  { from: 'Sabo', to: 'Barnawa' },
  { from: 'Barnawa', to: 'Sabo' },
  { from: 'Barnawa', to: 'Ugwuan Rimi' },
  { from: 'Ugwuan Rimi', to: 'Barnawa' },
  { from: 'Ugwuan Rimi', to: 'Sabo' },
  { from: 'Sabo', to: 'Ugwuan Rimi' },
];

export const DEFAULT_PRICE = 500; // ₦500