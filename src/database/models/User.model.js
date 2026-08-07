import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    game: {
        type: String,
        default: 'unknown'
    },
    region: {
        type: String,
        default: 'unknown'
    },
    rank: {
        type: String,
        default: 'unranked'
    },
    role: {
        type: String,
        default: 'any'
    },
    elo: {
        type: Number,
        default: 1000
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'in-lobby', 'in-match'],
        default: 'online'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
