const axios = require('axios').default;
(async ()=>{
  try{
    const login = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'khaliloullah6666@gmail.com',
      password: 'RBFMD5FABJJAa'
    }, { withCredentials: true });

    console.log('LOGIN_STATUS', login.status);
    console.log('LOGIN_DATA', JSON.stringify(login.data));
    const cookies = login.headers['set-cookie'] || [];
    const cookieHeader = cookies.join('; ');

    const client = axios.create({ baseURL: 'http://localhost:5001', headers: { Cookie: cookieHeader }, withCredentials: true });

    const me = await client.get('/api/auth/me').catch(e=>e.response? e.response : { status: 'ERR', data: e.message });
    console.log('ME_STATUS', me.status, 'ME_DATA', JSON.stringify(me.data));

    const health = await client.get('/api/health').catch(e=>e.response? e.response : { status: 'ERR', data: e.message });
    console.log('HEALTH_STATUS', health.status, 'HEALTH_DATA', JSON.stringify(health.data));

    const years = await client.get('/api/academic-years').catch(e=>e.response? e.response : { status: 'ERR', data: e.message });
    console.log('YEARS_STATUS', years.status, 'YEARS_DATA', JSON.stringify(years.data));

    const classes = await client.get('/api/classes').catch(e=>e.response? e.response : { status: 'ERR', data: e.message });
    console.log('CLASSES_STATUS', classes.status, 'CLASSES_DATA', JSON.stringify(classes.data));

  }catch(e){
    console.error('ERR', e.response? e.response.data : e.message);
    process.exitCode = 1;
  }
})();
