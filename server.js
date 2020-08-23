const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

/* =============================== */
/* ========  VIDEO CHAT  ========= */
/* =============================== */

/* ---------------------------------------- */
/* when a socket is connected to the server */
/**
 * EMITS: (socket.emit)
 *  host_exist      -> signals the current socket that host already exist
 *  create_peers    -> signals the connected socket (sender of join_room) 
 *                      to create peers that are in the room
 *  room_full       -> signals the connected socket (sender of join_room) 
 *                      that max people in a room has reached
 *  back_offer      -> send the offer request from the newly created peer 
 *                      to the receiver peer
 *  back_answer     -> send answer response from the receiver of the offer
 *                      to the newly created peer
 *  host_left       -> signal the other clients in the room that host has 
 *                      disconnected
 * HANDLES: (socket.on)
 *  join_room       -> let connected socket join room with roomID
 *                      if condition is met
 *  offer           -> see 'back_offer' from EMITS section
 *  answer          -> see 'back_answer' from EMITS section
 *  disconnect      -> (when socket disconnects)
 */
/* ---------------------------------------- */
const MAX_PER_ROOM = 3;

io.on('connection', socket => {
    console.log(socket.id + " connected ------------");
    let host = false;

    socket.on('join_room', payload => {
        const {
            roomID,
            isHost
        } = payload;
        const num_clients = numClientsInRoom(roomID);
        // if host already exist, emit 'host_exist'
        if (isHost && num_clients > 0) {
            socket.emit('host_exist');
        } else if (num_clients < MAX_PER_ROOM) {
            // join room with roomID
            socket.join(roomID);
            console.log(socket.id + " joined room " + roomID + " : " + num_clients);
            // if room already has client, create peer
            // (keep in mind that num_clients is declared before socket.join)
            if (num_clients > 0) {
                io.in(roomID).clients((error, clients) => {
                    if (error) throw error;

                    console.log('emitting create_peers to ' + socket.id);
                    console.log(clients.filter(id => id !== socket.id))
                    socket.emit('create_peers', clients.filter(id => id !== socket.id));
                })
            } else {
                host = true;
            }
        } else {
            socket.emit('room_full');
        }
    });

    /* ********************  */
    socket.on('offer', payload => {
        io.to(payload.receiverID).emit('back_offer', {
            signal: payload.signal,
            callerID: payload.callerID
        })
    });
    /* ********************  */
    socket.on('answer', payload => {
        io.to(payload.callerID).emit('back_answer', {
            signal: payload.signal,
            id: socket.id,
            isHost: host
        })
    })
    /* ********************  */
    socket.on('disconnecting', () => {
        const room = Object.keys(socket.rooms).find(r => r !== socket.id);
        socket.leave(room);
        if (host) {
            // disconnect everyone else in the room
            console.log('host left');
            io.in(room).clients((error, clients) => {
                if (error) throw error;

                console.log(clients);
                clients.forEach(clientID => {
                    // signals clients in the room that host has disconnected
                    io.sockets.connected[clientID].emit('host_left');
                    io.sockets.connected[clientID].disconnect();
                });
            })

        } else {
            console.log('emit user_disconnecting: ' + socket.id);
            console.log(room);
            io.in(room).clients((error, clients) => {
                if (error) throw error;

                console.log('clients: ' + clients);
            })
            // emit to other clients in the room that this user has disconnected
            socket.broadcast.to(room).emit('user_disconnected', socket.id);
        }


    });
    /* ********************  */
    socket.on('disconnect', reason => {
        if (reason === 'io server disconnect') {
            // the disconnection was initiated by the server,
            //  need to reconnect manually
            socket.connect();
        }
        console.log(socket.id + " left the room");
    });
})

/* get room with roomID */
const getRoom = roomID => {
    return io.sockets.adapter.rooms[roomID];
}

/* get the number of clients in a room */
const numClientsInRoom = roomID => {
    try {
        return getRoom(roomID).length;
    } catch (error) {
        return 0;
    }
}

const PORT = process.env.PORT || 8000;
/* Server running on PORT (usually port 8000) */
server.listen(PORT, console.log(`server running on port ${PORT}`));

module.exports = app;