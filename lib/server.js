'use strict'

const http = require('http')
const url = require('url')
const Hub = require('brisky-hub')
const pkg = require('../package.json')

module.exports = (port, registryHost) => {
  if (!port) {
    port = 80
  }
  if (!registryHost) {
    registryHost = process.env.REGISTRY_HOST
  }

  var list = []
  var timeout

  const hub = new Hub({
    id: +new Date(),
    url: `wss://${registryHost}`,
    context: false
  })

  function refresh () {
    const deployments = hub.get('deployments')

    var newRegistry = []

    deployments.each(dep => {
      if (!dep.get([ 'pkg', 'version' ])) {
        return
      }

      const deployment = {
        name: dep.name.compute(),
        version: dep.pkg.version.compute(),
        env: dep.pkg.env.compute(),
        url: dep.url.compute(),
        created: dep.created.compute()
      }

      const found = newRegistry.find(
        d => d.name === deployment.name && d.version === deployment.version && d.env === deployment.env
      )

      if (found && found.created < deployment.created) {
        found.url = deployment.url
        found.created = deployment.created
      } else if (!found) {
        newRegistry.push(deployment)
      }
    })

    newRegistry.sort((a, b) => {
      return a.created > b.created ? -1 : b.created > a.created ? 1 : 0
    })

    list = newRegistry
  }

  hub.subscribe({ deployments: { val: true } }, () => {
    clearTimeout(timeout)
    timeout = setTimeout(refresh, 500)
  })

  const server = http.createServer((request, response) => {
    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=4000',
      'Expires': new Date(Date.now() + 2000).toUTCString()
    })

    var result = list
    const pathname = url.parse(request.url).pathname

    if (pathname === '/deployments') {
      result = hub.get('deployments').serialize()
    } else if (pathname !== '/') {
      const name = pathname.slice(1)
      result = result.filter(d => d.name === name)
    }

    return response.end(JSON.stringify(result))
  }).listen(port)

  const close = server.close

  server.close = () => {
    hub.get('url').remove()
    close.apply(server, arguments)
  }

  return server
}
