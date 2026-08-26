import express from 'express'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { registerRoutes } from './routes'

const app = express()
app.use(express.json())

const redisHost = process.env.REDIS_HOST || 'redis'
const redisPort = Number(process.env.REDIS_PORT || 6379)

const connection = new IORedis({ host: redisHost, port: redisPort })
const taskQueue = new Queue('tasks', { connection })

// Register all routes from routes.ts
registerRoutes(app, taskQueue)

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
  console.log(`property-ai backend listening on ${PORT}`)
})
