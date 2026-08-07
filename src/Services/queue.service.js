// import redisClient from "../config/redis";
import { queue } from '../utils/mockData.js';
// const QUEUE_KEY="mathcing:queue"

class QueueService {
  async joinQueue(userId, elo, criteria) {
    const existing = queue.find(p => p.userId === userId);
    if (!existing) {
        queue.push({ userId, elo, ...criteria });
        return true;
    }
    return false;
  }

  async leaveQueue(userId) {
    const index = queue.findIndex(p => p.userId === userId);
    if (index !== -1) {
        queue.splice(index, 1);
        return true;
    }
    return false;
  }

  async isPlayerQueued(userId) {
    return queue.some(p => p.userId === userId);
  }
  
  async getQueuePlayers() {
    return [...queue];
  }
}
export default new QueueService();