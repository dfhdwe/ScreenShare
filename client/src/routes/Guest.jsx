import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import Video from './Video';
import './style.css';

const Guest = (props) => {

    const [peers, setPeers] = useState([]);     // stores all the peers
    const peers_ref = useRef([]);
    const socket_ref = useRef();                // reference to the user socket
    const screen_stream = useRef();
    const user_video = useRef();                // reference to the user video
    const roomID = props.match.params.roomID;   // current room id

    return (
        <div>

        </div>
    );
}

export default Guest;