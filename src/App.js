import React, { useEffect, useState } from 'react';
import { Skylink } from 'skylinkjs';
import { MdDateRange, MdCallEnd, MdVideocam, MdVideocamOff, MdMic, MdMicOff, MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { parseQueryString } from './utils';
import swal from 'sweetalert';

import './css/grid.css';
import './css/responsive.css';

const config = {
  appKey: '',
  defaultRoom: parseQueryString('room'),
  enableIceTrickle: true,
  enableDataChannel: true,
  forceSSL: true,
};

let skylink = new Skylink(config);

function App() {
  const [myPeerId, setMyPeerId] = useState('');
  const [micState, setMicState] = useState(false);
  const [camState, setCamState] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [showEndCall, setShowEndCall] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const roomType = document.getElementById('root').getAttribute('data-type');

  useEffect(() => {
    // Your code here
    skylink.on('mediaAccessSuccess', function(stream) {
      var vid = document.getElementById('myVideo');
      vid.muted = true;
      window.attachMediaStream(vid, stream);
      setShowControls(true);
    });

    skylink.on('incomingStream', function(peerId, stream, isSelf) {
      if(isSelf) return;
      var vid = document.getElementById(peerId);
      if (isSelf) {
        vid.muted = true;
      }
      window.attachMediaStream(vid, stream);
    });

    skylink.on('peerJoined', function(peerId, peerInfo, isSelf) {
      if(isSelf) return; // We already have a video element for our video and don't need to create a new one.
      var vid = document.createElement('video');
      var contentJoined = document.getElementById('remoteContainer');
      vid.autoplay = true;
      vid.controls = false;
      vid.setAttribute('playsinline', true);
      vid.muted = false; // Added to avoid feedback when testing locally
      vid.id = peerId;
      contentJoined.appendChild(vid);
    });

    skylink.on('peerLeft', function(peerId, peerInfo, isSelf) {
      if (!isSelf){
        document.getElementById(peerId).remove();
      }
    });

    skylink.on('iceConnectionState', function(peerId, peerInfo, isSelf) {
      console.log("Entre");
    });

    skylink.on('incomingMessage', function(message, peerId, peerInfo, isSelf) {
      if (message.content.type === 'endcall' && !isSelf && roomType == 'patient') {
        skylink.stopStream();
        setShowAuth(true);
        setShowEndCall(false);
        setShowControls(false);
        window.location.href = window.location.origin + '/online-appointment-finished';
      }
    });

    skylink.on('streamMuted', function(peerId, peerInfo, isSelf, isScreensharing) {
      console.log('peerId', peerId)
      console.log('isSelf', isSelf);
      console.log('peerInfo', peerInfo);
    });

    skylink.on('readyStateChange', function(message, peerId, peerInfo, isSelf) {
      console.log('readyStateChange', isSelf);
    });
    
    skylink.init(config, function (error, success) {
      if (error) {
        console.log('error.error', (error.error.message || error.error));
      } else {        
        console.log('Joined room.', success)
        setMyPeerId(success.peerId);
      }
    });

  }, []);

  const start = (event) => {
    skylink.joinRoom({
      audio: true,
      video: true
    }, function (error, success) {
      if (error) {
        console.log('error.error', error.error);
      } else {
        console.log('Joined room.')
        // console.log('Joined room.', success)
      }
    });

    setShowAuth(false);
    setShowEndCall(true);
  }

  const endCall = (event) => {

    swal({
      title: "Are you sure?",
      text: "You will stop the video call!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
        skylink.stopStream();
        setShowAuth(true);
        setShowEndCall(false);
        setShowControls(false);

        if (roomType != 'patient') {
          skylink.sendMessage({ type: 'endcall' });
        }
      }
    });

  }

  const muteMic = (event) => {
    setMicState(!micState);
    let videoMuted = skylink.getPeerInfo(myPeerId).mediaStatus.videoMuted;
    skylink.muteStream({
      audioMuted: !micState,
      videoMuted: videoMuted
    });
  }

  const muteCam = (event) => {
    let audioMuted = skylink.getPeerInfo(myPeerId).mediaStatus.audioMuted;
    setCamState(!camState);
    skylink.muteStream({
      audioMuted: audioMuted,
      videoMuted: !camState
    }); 
  }

  const shareScreen = () => {
    let audioMuted = skylink.getPeerInfo(myPeerId).mediaStatus.audioMuted;
  }

  const countDownUpdate = (data) => {
    console.log('countDownUpdate', countDownUpdate)
  }

  const countDownEnd = () => {
    setShowAuth(true);
  } 

  const sendMessage = (data) => {
    skylink.sendMessage(data.myMessage);
  }

  return (
    <div className="App contenedor">
      <div className="header-videocall text-left">
      <MdDateRange /> <span>My {roomType} </span>
      </div>
      
      <main className="content-app">
        <div id="remoteContainer" className="content-remote-video">
          
        </div>
        <div className="content-my-video">
          <video id="myVideo" autoPlay playsInline></video>
          {(() => {
            if (myPeerId !== '') {
              return <div className="content-control" style={{ display: (showControls) ? '' : 'none' }}>            
              <div className="control-item">
                {!micState && 
                  <MdMic
                    size="1.4em" color="#fff" 
                    style={{ background: 'rgb(139, 195, 74)', borderRadius: '50%', padding: '8px' }} 
                    onClick={ muteMic } 
                  />
                }
                {micState && <MdMicOff 
                  size="1.4em" 
                  color="#fff" 
                  style={{ background: 'red', borderRadius: '50%', padding: '8px' }} 
                  onClick={ muteMic } 
                />}
              </div>
              <div className="control-item">
                {
                  !camState && <MdVideocam 
                    size="1.4em" color="#fff" 
                    style={{ background: 'rgb(139, 195, 74)', borderRadius: '50%', padding: '8px' }} 
                    onClick={muteCam}
                  />
                }
                {
                  camState && <MdVideocamOff 
                    size="1.4em" color="#fff" 
                    style={{ background: 'red', borderRadius: '50%', padding: '8px' }} 
                    onClick={muteCam}
                  />
                }
              </div>
            </div>
            }
          })()}
          <div className="content-videocall-control-btn">
            <button 
              className="btn btn-success text-center btn-call" 
              onClick={start}
              style={{ display: (showAuth) ? '' : 'none' }}
              >
                <MdCallEnd size="1.4em" color="#fff"/>
                <span className="text-endcall">Start</span>
            </button>
            <button 
              className="btn btn-danger" 
              onClick={endCall}
              style={{ display: (showEndCall) ? '' : 'none' }}
              >
                <MdCallEnd size="1.4em" color="#fff"/>
                <span className="text-endcall">End</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;