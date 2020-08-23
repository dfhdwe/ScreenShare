import React, { useRef, useEffect } from 'react';

/**
 * Video chat video component
 * @param {Peer} peer
 * @param {string} id
 */

const Video = (props) => {
    const { peer, id, ...other } = props;
    const ref = useRef();

    useEffect(() => {
        peer.on('stream', stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <video id={id} playsInline autoPlay ref={ref} {...other} />
    );
}

export default Video;