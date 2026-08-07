import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    lobbyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lobby',
        required: true
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['active', 'finished'],
        default: 'active'
    },
    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

const Match = mongoose.model('Match', matchSchema);
export default Match;
