const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'statistics_20260421_164503.xlsx');
const wb = XLSX.readFile(filePath);

console.log('Sheet Names:', JSON.stringify(wb.SheetNames));
console.log('Total sheets:', wb.SheetNames.length);
console.log('');

wb.SheetNames.forEach((name, idx) => {
  const ws = wb.Sheets[name];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const merges = ws['!merges'] || [];
  
  console.log(`\n======== SHEET ${idx + 1}: "${name}" ========`);
  console.log(`Range: ${ws['!ref']}`);
  console.log(`Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}`);
  console.log(`Merged cells: ${merges.length}`);
  merges.forEach(m => {
    console.log(`  Merge: ${XLSX.utils.encode_range(m)}`);
  });
  
  // Print as JSON array of arrays
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('\nData (all rows):');
  data.forEach((row, ri) => {
    const nonEmpty = row.some(c => c !== '');
    if (nonEmpty) {
      console.log(`  Row ${ri + 1}: ${JSON.stringify(row)}`);
    }
  });
  
  // Print column widths if available
  if (ws['!cols']) {
    console.log('\nColumn widths:', JSON.stringify(ws['!cols']));
  }
});
