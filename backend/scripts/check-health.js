(async ()=>{
  try{
    const res = await fetch('http://localhost:5001/api/health');
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', text);
  }catch(e){
    console.error('ERR', e.message || e);
    process.exitCode = 1;
  }
})();
