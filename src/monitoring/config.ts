import type { Queue } from 'bull'

import type { MonitoringQueueData } from './worker'

export const MONITORING_QUEUE_NAME = 'monitoring'

export type MonitoringQueue = Queue<MonitoringQueueData>
