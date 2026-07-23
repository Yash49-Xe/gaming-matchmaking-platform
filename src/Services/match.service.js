import queueService from "./queue.service";

class MatchService{
    
    async processQueue(){
        const players = await queueService.getQueuePlayers();

        let i=0;

        while(i<players.length-1){
            const current=players[i];
            const next=players[i+1];

            const difference=next.elo-current.elo;

            if(difference<=threshold){
                // match them and move by 2
            }
            else{
                // move by one

            }
        }

    }

    createMatch(current,next){
        
    }
}
export default new MatchService();