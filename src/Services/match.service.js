import queueService from "./queue.service.js";
import {v4 as uuidv4} from "uuid";
// import Match from "../models/match.mode";
import { getIO } from "../config/socket.js";
import { matches } from "../utils/mockData.js";


class MatchService{
    

    async createMatch({
        player1,
        player2
    }){

        const io=getIO();
        try{
            // Generate UUID
        const matchID=uuidv4();
        // Randomly assign X and O
        const isPlayer1X=Math.random()<0.5;

        let playerX;
        let playerO;

        if(isPlayer1X){
            playerX=player1;
            playerO=player2;
        }
        else{
            playerX=player2;
            playerO=player1;
        }
        // Create Match mock
        const match= {
            id: matchID,
            playerX,
            playerO,
            status: 'active'
        };
        // Save to mock memory
        matches.set(matchID, match);
        // Emit matchFound (placeholder logic, would emit to room)
        io.emit('matchFound', { matchID });

        
        
        }catch(error){
            throw error;
        }
    }
}
export default new MatchService();