import queueService from "../Services/queue.service";
import MatchService from "../Services/match.service";

const MAX_ELO_DIFF=20;

class MatchmakingWorker{

    isRunning=false;

    isProcessing=false;

    intervalId=null;
//    Start function
    async start(){
        if(this.isRunning){
            return;
        }
        this.isRunning=true;
        this.intervalId=setInterval(async()=>{
            if(isProcessing) return ;

            this.isProcessing=true;

            try{
                await this.processQueue();
            }
            finally{
                this.isProcessing=false;
            }
        },2000);
    }
//   Stop function
    stop(){
        if(!this.isRunning){
            return;
        }

        clearInterval(this.intervalId);

        this.intervalId=null;

        this.isRunning=false;
    }
// Process Queue

   async processQueue(){
        const players = await queueService.getQueuePlayers();

        if(players.length<2){
            return;
        }

        const matchedPlayers=new Set();

        let i=0;

        while(i<players.length-1){
            const current=players[i];
            const next=players[i+1];

            const difference=next.elo-current.elo;

            if(difference<=threshold){
                // match them and move by 2
                matchedPlayers.add(current.userId);
                matchedPlayers.add(next.userId);
                i+=2;
            }
            else{
                // move by one
                ++i;
            }
        }

    }

}

export default new MatchmakingWorker();