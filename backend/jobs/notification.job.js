const { Queue, Worker } = require('bullmq');
const Notification = require('../models/Notification');
const { getIO } = require('../utils/socket');

const QUEUE_NAME = 'notifications';
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

// Single queue instance
const notificationQueue = new Queue(QUEUE_NAME, { connection });

async function addNotificationJob(payload) {
  return notificationQueue.add('create', payload, {
    removeOnComplete: 500,
    removeOnFail: 1000,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

function startNotificationWorker() {
  const worker = new Worker(QUEUE_NAME, async (job) => {
    const data = job.data || {};
    const { title, description, category, recipientType, student, institution, branch, institutionAdmin, metadata } = data;

    const doc = await Notification.create({ title, description, category, recipientType, student, institution, branch, institutionAdmin, metadata });

    try {
      const io = getIO();
      if (io) {
        if (recipientType === 'INSTITUTION' && institution) io.to(`institution:${institution}`).emit('notificationCreated', { notification: doc });
        if (recipientType === 'ADMIN' && institutionAdmin) io.to(`institutionAdmin:${institutionAdmin}`).emit('notificationCreated', { notification: doc });
        if (recipientType === 'STUDENT' && student) io.to(`student:${student}`).emit('notificationCreated', { notification: doc });
        if (recipientType === 'BRANCH' && branch) io.to(`branch:${branch}`).emit('notificationCreated', { notification: doc });
      }
    } catch {}
  }, { connection });

  worker.on('error', (err) => {
    console.error('Notification worker error:', err?.message || err);
  });

  return worker;
}

module.exports = { addNotificationJob, startNotificationWorker };


