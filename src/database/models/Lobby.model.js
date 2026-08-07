import mongoose from 'mongoose';

const lobbySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    game: {
        type: String,
        required: true
    },
    leaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['waiting', 'in_match', 'finished'],
        default: 'waiting'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    readyStatus: {
        type: Map,
        of: Boolean,
        default: {}
    },
    joinRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;
