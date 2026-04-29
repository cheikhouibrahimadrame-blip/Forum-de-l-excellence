(async ()=>{
  try{
    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'khaliloullah6666@gmail.com', password: 'RBFMD5FABJJAa' })
    });

    const headers = {};
    res.headers.forEach((v,k)=> headers[k]=v);
    const body = await res.text();
    console.log('STATUS', res.status);
    console.log('HEADERS', JSON.stringify(headers));
    console.log('BODY', body);
  }catch(e){
    console.error('ERR', e && e.message ? e.message : e);
    process.exitCode = 1;
  }
})();
