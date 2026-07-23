import redisClient from "../config/redis";
const QUEUE_KEY="mathcing:queue"

class QueueService {
  async joinQueue(userId, elo) {
   const result=await redisClient.zAdd(
    QUEUE_KEY,
      [
         {
           score:elo,
           value:userId
         }
      ],
     {
           NX:true 
     }
   );
   return result===1;
  }


  async leaveQueue(userId) {
    const result= await redisClient.zRem(
      QUEUE_KEY,
      userId
    );
    return result===1;
  }
  async isPlayerQueued(userId) {
    
    const score = await redisClient.zScore(QUEUE_KEY,userId);

    return score!==null;
  }
  
  async getQueuePlayers() {
    //  return all players currently waiting
    const redisPlayers = await redisClient.zRange(
      QUEUE_KEY,
      0,
      -1,
      {
        WITHSCORES:true
      }
    );
    const players=redisPlayers.map((player)=>{
      return {
        userId : player.value,
        elo : player.score
      };
    });
    return players;
  }
}
export default new QueueService();