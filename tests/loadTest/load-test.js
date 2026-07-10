import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function () {
  let accountList = [];
  // Looping dari 1 sampai 100 (Karena kamu sekarang punya tester1 s/d tester100)
  for (let i = 1; i <= 500; i++) {
    accountList.push({ 
        email: `tester${i}@mail.com`, 
        password: 'password123' 
    });
  }
  return accountList;
});

export const options = {
  stages: [
    { duration: '20s', target: 100 },
    { duration: '30s', target: 150 },
    { duration: '10s', target: 0 },
  ],
};

const BASE_URL = 'http://192.168.1.7:8000/api';

export default function () {
  const user = users[(__VU - 1) % users.length];

  const loginPayload = JSON.stringify({ email: user.email, password: user.password });
  const loginRes = http.post(`${BASE_URL}/users/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, { 'login sukses (200)': (r) => r.status === 200 });

  if (loginRes.status !== 200) {
    sleep(1);
    return;
  }

  const token = loginRes.json('data.token');
  const authHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': `Bearer ${token}`, // Middleware auth kamu membaca format ini
  };

  sleep(0.5);

  const cartPayload = JSON.stringify({
    productId: 104,
    quantity: 1,
    spice_level: 2
  });

  const cartRes = http.post(`${BASE_URL}/carts`, cartPayload, { headers: authHeaders });
  check(cartRes, { 'masuk keranjang sukses (200)': (r) => r.status === 200 });

  sleep(0.5);

  const orderPayload = JSON.stringify({
    username: 'Tester Load',
    no_wa: '08123456789',
    address: 'Jl. Testing No. 10'
  })

  const orderRes = http.post(`${BASE_URL}/orders`, orderPayload, { headers: authHeaders });
  check(orderRes, { 'checkout order sukses (201)': (r) => r.status === 201 });

  sleep(1);
}