import { Express } from 'express'
import { Queue } from 'bullmq'

export function registerRoutes(app: Express, taskQueue: Queue) {
  app.get('/', (req, res) => {
    res.send(`Hello from solar save backend
      \ncurrently we have only /enqueue route
    `)
  })

  app.post('/enqueue', async (req, res) => {
    try {
      const { type = 'default', payload = {} } = req.body || {}
      const job = await taskQueue.add(type, payload, { attempts: 3 })
      return res.json({ id: job.id })
    } catch (err) {
      console.error('enqueue error', err)
      return res.status(500).json({ error: 'failed to enqueue' })
    }
  })
}
