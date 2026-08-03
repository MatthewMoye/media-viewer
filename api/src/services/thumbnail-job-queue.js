const { config } = require("../config");

const activeJobsByKey = new Map();
const pendingJobs = [];
let activeWorkerCount = 0;

const MAX_CONCURRENT_WORKERS = config.thumbnailWorkerCount;

function sortPendingJobs() {
  pendingJobs.sort((left, right) => right.priority - left.priority);
}

function removePendingJob(job) {
  const index = pendingJobs.indexOf(job);
  if (index >= 0) {
    pendingJobs.splice(index, 1);
  }
}

function getGroupSnapshot() {
  const groupStats = {};

  for (const pendingJob of pendingJobs) {
    const current = groupStats[pendingJob.group] || {
      pending: 0,
      running: 0,
    };

    current.pending += 1;
    groupStats[pendingJob.group] = current;
  }

  for (const job of activeJobsByKey.values()) {
    if (!job.running) {
      continue;
    }

    const current = groupStats[job.group] || {
      pending: 0,
      running: 0,
    };

    current.running += 1;
    groupStats[job.group] = current;
  }

  return groupStats;
}

function drainQueue() {
  while (activeWorkerCount < MAX_CONCURRENT_WORKERS && pendingJobs.length > 0) {
    const job = pendingJobs.shift();
    activeWorkerCount += 1;
    job.running = true;

    job
      .run()
      .then(job.resolve)
      .catch(job.reject)
      .finally(() => {
        activeJobsByKey.delete(job.jobKey);
        activeWorkerCount = Math.max(0, activeWorkerCount - 1);
        drainQueue();
      });
  }
}

function enqueueJob({ jobKey, group, priority, run }) {
  const existingJob = activeJobsByKey.get(jobKey);

  if (existingJob) {
    if (priority > existingJob.priority && !existingJob.running) {
      removePendingJob(existingJob);
      existingJob.priority = priority;
      pendingJobs.push(existingJob);
      sortPendingJobs();
    }

    return existingJob.promise;
  }

  let resolveJob;
  let rejectJob;

  const promise = new Promise((resolve, reject) => {
    resolveJob = resolve;
    rejectJob = reject;
  });

  const job = {
    jobKey,
    group,
    priority,
    run,
    running: false,
    promise,
    resolve: resolveJob,
    reject: rejectJob,
  };

  activeJobsByKey.set(jobKey, job);
  pendingJobs.push(job);
  sortPendingJobs();
  drainQueue();

  return promise;
}

function getThumbnailJobQueueStatus() {
  return {
    activeWorkers: activeWorkerCount,
    pendingJobs: pendingJobs.length,
    trackedJobs: activeJobsByKey.size,
    maxConcurrentWorkers: MAX_CONCURRENT_WORKERS,
    groups: getGroupSnapshot(),
  };
}

module.exports = {
  enqueueJob,
  getThumbnailJobQueueStatus,
};
