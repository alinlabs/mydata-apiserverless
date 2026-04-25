import fs from 'fs';

fetch('http://localhost:3000/gambar/logo/100/qris.png')
  .then(res => {
    console.log('Status: ', res.status);
    console.log('Content-Type: ', res.headers.get('content-type'));
    return res.text();
  })
  .then(text => console.log('Length: ', text.length))
  .catch(console.error);
