const axios = require('axios').default;
(async ()=>{
  try{
    const login = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'khaliloullah6666@gmail.com',
      password: 'RBFMD5FABJJAa'
    }, { withCredentials: true, validateStatus: () => true });

    console.log('LOGIN_STATUS', login.status);
    console.log('LOGIN_DATA', JSON.stringify(login.data));
    const cookies = login.headers['set-cookie'] || [];
    console.log('RAW_COOKIES', cookies);
    const cookieHeader = cookies.join('; ');

    const client = axios.create({ baseURL: 'http://localhost:5001', headers: { Cookie: cookieHeader }, withCredentials: true, validateStatus: () => true });

    const me = await client.get('/api/auth/me');
    console.log('ME_STATUS', me.status, 'ME_DATA', JSON.stringify(me.data));

    const health = await client.get('/api/health');
    console.log('HEALTH_STATUS', health.status, 'HEALTH_DATA', JSON.stringify(health.data));

    const years = await client.get('/api/academic-years');
    console.log('YEARS_STATUS', years.status, 'YEARS_DATA', JSON.stringify(years.data));

    const classes = await client.get('/api/classes');
    console.log('CLASSES_STATUS', classes.status, 'CLASSES_DATA', JSON.stringify(classes.data));

  }catch(e){
    try{ console.error('ERR_STACK', e.stack); }catch(er){ console.error('ERR_RAW', JSON.stringify(e)); }
    process.exitCode = 1;
  }
})();
