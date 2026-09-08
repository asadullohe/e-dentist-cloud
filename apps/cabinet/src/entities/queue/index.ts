export { fetchBoard, fetchScreen, fetchTicket, joinQueue } from './api'
export {
  QUEUE_KEYS,
  useJoinQueue,
  useQueueBoard,
  useQueueScreen,
  useQueueStream,
  useQueueTicket,
} from './hooks'
export type { QueueBoard, QueueDoctor, QueueScreen, QueueStatus, QueueTicket } from './model'
