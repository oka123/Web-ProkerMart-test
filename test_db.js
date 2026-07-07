const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://dpvmnubuvrqzehbjnnyd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm1udWJ1dnJxemVoYmpubnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTc0MjUsImV4cCI6MjA5NDIzMzQyNX0.9Rk6vFNuXQvTjTlookNTJVaC1hwN_9d1YhhHBYute68'
);

async function test() {
  const { data: orgData } = await supabase.from('organisasi').select('id_organisasi').limit(1).single();
  const { data: penggunaData } = await supabase.from('pengguna').select('id_pengguna').limit(1).single();
  
  if (orgData && penggunaData) {
    const { error } = await supabase.from('organisasi_member').insert({
      id_organisasi: orgData.id_organisasi,
      id_pengguna: penggunaData.id_pengguna,
      jabatan: 'anggota_staff'
    });
    console.log("Insert Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("No org or pengguna");
  }
}
test();
