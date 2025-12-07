const XLSX = require('xlsx');

const wb = XLSX.readFile('data/products-map/product-map-2025-12-02.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

// Find all rows with duplicate shopee_code
const shopeeMap = new Map();
data.forEach((row, idx) => {
  const shopee = row.shopee_code || row.Shopee || row['Shopee Code'];
  if (shopee && String(shopee).trim()) {
    const key = String(shopee).trim();
    const list = shopeeMap.get(key) || [];
    list.push({
      row: idx + 2,
      name: row.name || row.Name || '(no name)',
      shopee_code: key,
      sku: row.sku || row.SKU || '-'
    });
    shopeeMap.set(key, list);
  }
});

// Show only duplicates
console.log('🔍 Duplicate Shopee Codes found:\n');
let foundDup = false;
for (const [code, products] of shopeeMap.entries()) {
  if (products.length > 1) {
    foundDup = true;
    console.log('❌ Shopee Code:', code);
    console.log('   Used by', products.length, 'products:');
    products.forEach(p => {
      console.log('   - Row', p.row + ':', p.name, '(SKU:', p.sku + ')');
    });
    console.log('');
  }
}

if (!foundDup) {
  console.log('✅ No duplicates found!');
} else {
  console.log('⚠️  Fix: Each Shopee Code must be unique across all products.');
  console.log('    Either remove duplicate rows or change the Shopee Code values.');
}
