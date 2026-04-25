import sizeOf from 'image-size';
try {
  console.log(sizeOf('public/gambar/logo/ewallet/shopeepay.png'));
} catch (e) {
  console.log('error', e);
}
