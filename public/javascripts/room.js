'use strict'

var mediaRecorderCamera; // media录制摄像头
var mediaRecorderScreen; // media录制屏幕

let recordedBlobsCamera; // 录制下来的内容
let recordedBlobsScreen; // 录制下来的内容
let isRecording = false;

// 先把页面元素拿到
const cameraBtn = document.querySelector('button#camera-button'); // 启动摄像头按钮

const previewV1 = document.querySelector('#v1'); // 预览用的
const previewV2 = document.querySelector('video#sub-video'); // 预览用的

var streamCamera;
var streamScreen;
var socketCamera;
var socketScreen;

function getSupportedMimeTypes() {
    const possibleTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/mp4;codecs=h264,aac',
    ];
    return possibleTypes.filter(mimeType => {
        return MediaRecorder.isTypeSupported(mimeType);
    });
}

var url = "wss://106.12.116.24:3001"
var user = "ww"

// 启动摄像头
cameraBtn.addEventListener('click', async () => {
    if (cameraBtn.getAttribute('state') == 'off') {
        // const isEchoCancellation = document.querySelector('#echoCancellation').checked;
        const constraints = {
            audio: {
                // echoCancellation: { exact: false },
                audio: true
            },
            video: {
                width: 1280,
                height: 720,
                frameRate: 30
            }
        };
        await init(constraints);
        cameraBtn.setAttribute('state', 'on');
        cameraBtn.innerHTML = '关闭摄像头';
    } else {
        var stream = previewV1.srcObject;
        if (stream == null) {
            return;
        }
        const tracks = stream.getTracks();
        tracks.forEach(function (track) {
            track.stop();
        });
        previewV1.srcObject = null;
        window.stream = null;
        cameraBtn.disabled = false;
        cameraBtn.setAttribute('state', 'off');
        cameraBtn.innerHTML = '开启摄像头';
    }
});

async function init(constraints) {
    try {
        streamCamera = await navigator.mediaDevices.getUserMedia(constraints);
        streamScreen = await navigator.mediaDevices.getDisplayMedia(constraints);
        //const streamScreen = NULL;

        gotStream(streamCamera, streamScreen);
    } catch (e) {
        console.log(`navigator.getUserMedia error:${e.toString()}`);
    }
}

function gotStream(streamCamera, streamScreen) {
    //showMsg('拿到了 stream:', stream);
    window.stream = streamCamera;
    window.stream = streamScreen;
    previewV1.srcObject = streamCamera;
    //previewV1.srcObject = streamScreen;
}

function startRecording() {
    recordedBlobsCamera = [];
    recordedBlobsScreen = [];
    const mimeType = 'video/webm;codecs=vp9,opus';
    const options = { mimeType };

    try {
        mediaRecorderCamera = new MediaRecorder(streamCamera, options);
        mediaRecorderScreen = new MediaRecorder(streamScreen, options);
        socketCamera = new WebSocket(url + "/camera/" + user); // 与服务器的连接
        socketScreen = new WebSocket(url + "/screen/" + user);
        setTimeout(() => {
            socketScreen.send('screen test');
        }, 50);
    } catch (e) {
        console.log(`创建MediaRecorder出错: ${JSON.stringify(e)}`);
        return;
    }

    //showMsg('创建MediaRecorder', mediaRecorderCamera, ' -> options', options);
    isRecording = true;
    mediaRecorderCamera.onstop = (event) => {
        //showMsg('录制停止了: ' + event);
        //showMsg('录制的数据Blobs: ' + recordedBlobs);
    };
    mediaRecorderCamera.ondataavailable = handleDataAvailable1;
    mediaRecorderCamera.start(1000);
    mediaRecorderScreen.ondataavailable = handleDataAvailable2;
    mediaRecorderScreen.start(1000);
    //showMsg('录制开始 mediaRecorder: ' + mediaRecorderScreen);
}

function stopRecording() {
    mediaRecorderCamera.stop();
    mediaRecorderScreen.stop();
    socketCamera.close();
    socketScreen.close();
}

function handleDataAvailable1(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobsCamera.push(event.data);
        console.log("bufferCamera:")
        console.log(event.data.size)
        // sendMsg();
        socketCamera.send(event.data);
    }
}

function handleDataAvailable2(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobsScreen.push(event.data);
        console.log("bufferScreen:")
        //console.log(bufferScreen)
        // sendMsg();
        socketScreen.send(event.data);
    }
}

window.onunload = function () {
    socketCamera.close();
    socketScreen.close();
};
