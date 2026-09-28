import { appendRowsToSheet } from './lib/sheets';

appendRowsToSheet('Test', [['Hello', 'World']])
  .then(console.log)
  .catch(console.error);
