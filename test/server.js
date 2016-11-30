'use strict'

const test = require('tape')
const sinon = require('sinon')
const Hub = require('brisky-hub')
const http = require('http')

const server = require('../lib/server')

test('list - JSON', t => {
  const subscribe = sinon.stub(Hub.prototype, 'subscribe')
  const get = sinon.stub(Hub.prototype, 'get')

  const deployments = new Hub({
    1: { name: 's1', url: 'u1.sh', created: 11, pkg: { version: '1', env: 'a=b', routes: {}, wrapper: {} } },
    2: { name: 's1', url: 'u2.sh', created: 12, pkg: { version: '1', env: 'a=c', routes: {}, wrapper: {} } },
    3: { name: 's1', url: 'u3.sh', created: 13, pkg: { version: '1', env: 'a=b', routes: {}, wrapper: {} } },
    4: { name: 's1', url: 'u4.sh', created: 21, pkg: { version: '2', env: 'c=d', routes: {}, wrapper: {} } },
    5: { name: 's1', url: 'u5.sh', created: 22, pkg: { version: '2', env: 'a=b&c=d', routes: {}, wrapper: {} } },
    6: { name: 's2', url: 'u6.sh', created: 11, pkg: { version: '1', env: 'c=d', routes: {}, wrapper: {} } },
    7: { name: 's2', url: 'u7.sh', created: 21, pkg: { version: '2', env: 'a=b', routes: {}, wrapper: {} } },
    8: { name: 's2', url: 'u8.sh', created: 22, pkg: { version: '2', env: 'a=b&c=d', routes: {}, wrapper: {} } },
    9: { name: 's3', url: 'u9.sh', created: 11, pkg: { version: '1', env: 'a=b&c=d', routes: {}, wrapper: {} } },
    10: { name: 's4', url: 'u10.sh', created: 11, pkg: { version: '1', env: 'a=b&c=d', routes: {}, wrapper: {} } },
    99: { name: 's10', url: 'u99.sh', created: 11, pkg: {} }
  })

  subscribe
    .withArgs({ deployments: { val: true } })
    .callsArg(1)

  get
    .withArgs('deployments')
    .returns(deployments)

  t.plan(1)

  const s = server(6699, 'localhost:9966')

  setTimeout(() => {
    http.get('http://localhost:6699/', res => {
      var data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        t.deepEqual(JSON.parse(data), [
          {name: 's1', version: '2', env: 'a=b&c=d', url: 'u5.sh', created: 22},
          {name: 's2', version: '2', env: 'a=b&c=d', url: 'u8.sh', created: 22},
          {name: 's1', version: '2', env: 'c=d', url: 'u4.sh', created: 21},
          {name: 's2', version: '2', env: 'a=b', url: 'u7.sh', created: 21},
          {name: 's1', version: '1', env: 'a=b', url: 'u3.sh', created: 13},
          {name: 's1', version: '1', env: 'a=c', url: 'u2.sh', created: 12},
          {name: 's2', version: '1', env: 'c=d', url: 'u6.sh', created: 11},
          {name: 's3', version: '1', env: 'a=b&c=d', url: 'u9.sh', created: 11},
          {name: 's4', version: '1', env: 'a=b&c=d', url: 'u10.sh', created: 11}
        ], 'list returns as expected')
        subscribe.restore()
        get.restore()
        s.close()
      })
    }).on('error', err => {
      console.log(err)
    })
  }, 1000)
})
