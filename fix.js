const fs = require('fs');

const files = [
  'src/app/org-dashboard/page.tsx',
  'src/app/org-dashboard/stores/page.tsx',
  'src/app/org-dashboard/agregat/page.tsx',
  'src/app/org-dashboard/members/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/if \(!org\?\.id_toko\) return;/, 'if (!org?.id_toko) { setLoading(false); return; }');
  content = content.replace(/if \(!org\?\.id_organisasi \|\| !org\?\.id_toko\) return;/, 'if (!org?.id_organisasi || !org?.id_toko) { setLoading(false); return; }');
  fs.writeFileSync(file, content);
}
