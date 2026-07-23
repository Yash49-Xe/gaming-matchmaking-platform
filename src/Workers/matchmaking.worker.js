import queueService from "../Services/queue.service";
import MatchService from "../Services/match.service";

class MatchmakingWorker{

    isRunning=false;

    interValid=null;
}

export default new MatchmakingWorker();