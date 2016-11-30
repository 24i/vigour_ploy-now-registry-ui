'use strict'

const now = require('observe-now')

const registry = now.deployment(process.env.NOW_TOKEN)
  .deploy(process.cwd(), {
    REGISTRY_HOST: process.env.REGISTRY_HOST
  })
  .on('deployed', () => {
    console.log(registry.id.compute(), registry.url.compute())
    console.log('Deployed to now, waiting until ready...')
  })
  .on('ready', () => {
    console.log('Deployment ready, aliasing...')
    registry.alias(process.env.REGISTRY_UI_HOST)
  })
  .on('aliased', () => {
    console.log('Alias successful!')
    registry.set(null)
  })
  .on('error', error => {
    console.error('Deployment failed due to error: %j, stack: %s', error, error ? error.stack : '(no stack)')
  })
