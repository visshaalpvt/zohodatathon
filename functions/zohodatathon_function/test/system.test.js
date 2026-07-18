const test = require('node:test');
const assert = require('node:assert/strict');
const { handleHealth } = require('../api/system');

test('handleHealth does not expose environment variables or request headers', async () => {
  let payload;
  const req = {
    path: '/health',
    originalUrl: '/health',
    headers: {
      authorization: 'Bearer secret-token',
      host: 'example.com'
    }
  };
  const res = {
    json: (body) => {
      payload = body;
    }
  };

  await handleHealth(req, res);

  assert.equal(payload.success, true);
  assert.equal(payload.reqPath, '/health');
  assert.equal(payload.reqOriginalUrl, '/health');
  assert.equal(payload.env, undefined);
  assert.equal(payload.headers, undefined);
});
