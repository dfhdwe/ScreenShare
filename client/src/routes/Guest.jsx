import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import Video from './Video';
import './style.css';

const Guest = (props) => {

    const [peers, setPeers] = useState([]);     // stores all the peers
    const peers_ref = useRef([]);
    const socket_ref = useRef();                // reference to the user socket
    const user_video = useRef();                // reference to the user video
    const roomID = props.match.params.roomID;   // current room id
    const [hostID, setHostID] = useState("");

    /* -------------------- */
    /* Runs at first render */
    /* -------------------- */

    useEffect(() => {
        console.log('useEffect ... first')
        // connect to server
        socket_ref.current = io.connect();
        // get video and audio stream
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(stream => {
            // set current user video and audio stream
            user_video.current.srcObject = stream;

            // signals server current user has joined the room with roomID
            socket_ref.current.emit('join_room', { roomID, isHost: false });

            /** ----------------------------------------
             * HANDLES: (socket_ref.current.on) 
             *                      (Helper functions)
             *  create_peers        create_peer
             *  room_full           add_peer
             *  back_offer
             *  back_answer
             *  user_disconnected
             *  host_left
             * ---------------------------------------- */

            socket_ref.current.on('create_peers', users => {
                console.log('create_peers: ' + socket_ref.current.id);
                const ps = [];
                // for each user, create a peer and
                //  send offer to their client to establish connections
                users.forEach(peerID => {
                    const peer = create_peer(peerID, stream);
                    peers_ref.current.push({
                        peerID,
                        peer
                    });
                    ps.push({ peerID, peer });
                });
                setPeers(ps);
            });

            /* ********************  */
            socket_ref.current.on('room_full', () => {
                document.write('Room full, please come back later');
            });

            /* ********************  */
            socket_ref.current.on('back_offer', payload => {
                console.log('back_offer: ' + socket_ref.current.id);

                const peer = add_peer(payload.signal, payload.callerID, stream);
                peers_ref.current.push({
                    peerID: payload.callerID,
                    peer,
                });

                // update this client's peers list
                setPeers(users => [...users, {
                    peerID: payload.callerID,
                    peer
                }]);
            });

            /* ********************  */
            socket_ref.current.on('back_answer', payload => {
                console.log('back_answer: ' + socket_ref.current.id);
                if (payload.isHost) {
                    setHostID(payload.id);
                }
                const item = peers_ref.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            /* ********************  */
            socket_ref.current.on('user_disconnected', peerID => {
                console.log('user_disconnected: ' + socket_ref.current.id);
                document.getElementById(peerID).remove();
                peers_ref.current.find(item => {
                    return item.peerID === peerID;
                }).peer.destroy();
                peers_ref.current = peers_ref.current.filter(item => {
                    return item.peerID !== peerID;
                })
            });

            /* ********************  */
            socket_ref.current.on('host_left', () => {
                document.write('host has left the room');
            });

        });
    }, []);

    /* ---------------------------------------- */
    /* Helper Functions */
    /**
     *  create_peer     @param {receiverID, stream}
     *  add_peer        @param {incoming_signal, callerID, stream}
     */
    /* ---------------------------------------- */

    const create_peer = (receiverID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on('signal', signal => {
            socket_ref.current.emit('offer', {
                callerID: socket_ref.current.id,
                receiverID,
                signal
            });
        });

        return peer
    };

    const add_peer = (incoming_signal, callerID, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on('signal', signal => {
            socket_ref.current.emit('answer', { signal, callerID });
        });

        peer.signal(incoming_signal);

        return peer;
    }

    return (
        <div>

        </div>
    );
}

export default Guest;