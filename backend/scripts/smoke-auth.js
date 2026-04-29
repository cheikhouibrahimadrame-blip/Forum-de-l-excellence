const axios = require('axios').default;
(async ()=>{
  try{
    const res = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'khaliloullah6666@gmail.com',
      password: 'RBFMD5FABJJAa'
    }, { withCredentials: true });
    console.log('STATUS', res.status);
    console.log('DATA', JSON.stringify(res.data, null, 2));
    console.log('COOKIES', res.headers['set-cookie'] || null);
  }catch(e){
    if(e.response){
      console.error('HTTP', e.response.status, JSON.stringify(e.response.data));
    } else {
      console.error('ERR', e.message);
    }
    process.exitCode = 1;
  }
})();