let io;

export function initializeSocket(socketInstance){
    io=socketInstance;
}

export function getIO(){
    if(!io){
        throw new Error("Socket.IO is not initialized");
    }
    return io;
}