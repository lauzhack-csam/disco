import cors from 'cors'
import express from 'express'
import expressWS from 'express-ws'

import { federatedRouter, decentralisedRouter } from './router/router'
import models from './tasks/models'

// enable websocket
const app = expressWS(express()).app

app.enable('trust proxy')
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: false }))

// Asynchronously create and save Tensorflow models to local storage
models.forEach((createModel) => { createModel().catch(console.error) })

app.use('/deai', decentralisedRouter)
app.use('/feai', federatedRouter)
app.get('/', (_, res) => res.send('Server for DeAI & FeAI'))

export default app