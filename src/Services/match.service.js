import queueService from "./queue.service";
import {v4 as uuidv4} from "uuid";
import Match from "../models/match.mode";
import { getIO } from "../config/socket";


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
        // Create Match document
        const match=new Match({
            matchID,
            playerX,
            playerO
        });
        // Save to MongoDB
        await match.save;
        // Create Socket.IO room
        // Emit matchFound

        
        
        }catch(error){
            throw error;
        }
    }
}
export default new MatchService();