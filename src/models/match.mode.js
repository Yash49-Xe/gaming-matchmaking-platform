import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
    matchID: {
        type: String,
        unique: true,
        required: true
    },
    playerX: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    playerO: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    currentTurn: {
        type:String,
        enum: ["X","O"],
        default: "X"
    },
    status:{
        type:String,
        enum:["active","finished"],
        default:"active"
    },
    winner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:null
    }


},{
    timestamps: true
});

const Match = mongoose.model("Match",matchSchema);
export default Match;