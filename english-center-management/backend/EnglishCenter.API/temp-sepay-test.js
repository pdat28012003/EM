const fs = require('fs');
const https = require('https');
const cfg = JSON.parse(fs.readFileSync('appsettings.json', 'utf8')).SePay;
const body = JSON.stringify({
  accountNumber: cfg.AccountNumber,
  accountName: cfg.AccountName,
  acqId: cfg.AcqId,
  addInfo: 'EC-PAY-TEST-999',
  amount: 1000,
  template: 'compact'
});
const u = new URL(cfg.ApiUrl);
const opts = {
  hostname: u.hostname,
  port: u.port || 443,
  path: u.pathname + u.search,
  method: 'POST',
  headers: {
    Authorization: 'Apikey ' + cfg.ApiKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};
const req = https.request(opts, res => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('BODY_START', data.slice(0, 1200));
    console.log('BODY_LENGTH', data.length);
  });
});
req.on('error', err => { console.error('ERR', err.message); });
req.write(body);
req.end();
