import { Worker } from 'bullmq'
import IORedis from 'ioredis'

const redisHost = process.env.REDIS_HOST || 'redis'
const redisPort = Number(process.env.REDIS_PORT || 6379)
const connection = new IORedis({ host: redisHost, port: redisPort })

const worker = new Worker(
  'tasks',
  async (job) => {
    console.log('Processing job', job.id, job.name, job.data)
    // Simulate work for now...
    await new Promise((res) => setTimeout(res, 1000))
    console.log('Done job', job.id)
    return { ok: true }
  },
  { connection }
)

worker.on('completed', (job) => {
  console.log('Job completed', job.id)
})

worker.on('failed', (job, err) => {
  console.error('Job failed', job?.id, err)
})

console.log('Worker started, listening for jobs on queue: tasks')
