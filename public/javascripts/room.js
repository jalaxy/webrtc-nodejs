'use strict'

var config;

var mediaRecorderCamera; // media录制摄像头
var mediaRecorderScreen; // media录制屏幕

let recordedBlobsCamera; // 录制下来的内容
let recordedBlobsScreen; // 录制下来的内容

// 先把页面元素拿到
const cameraBtn = document.querySelector('button#camera-button'); // 启动摄像头按钮
const screenBtn = document.querySelector('button#screen-button');
const logoutBtn = document.querySelector('button#logout-button');

const previewV1 = document.querySelector('#v1'); // 预览用的
const previewV2 = document.querySelector('#v2'); // 预览用的

var streamCamera;
var streamScreen;
var socketCamera;
var socketScreen;

// 启动摄像头
cameraBtn.addEventListener('click', async () => {
    if (cameraBtn.getAttribute('state') == 'off') {
        try {
            streamCamera = await navigator.mediaDevices.getUserMedia({
                audio: { audio: false },
                video: {
                    width: config.frame.width,
                    height: config.frame.height,
                    frameRate: config.frame.rate
                }
            });
            previewV1.srcObject = streamCamera;
        } catch (e) {
            console.log(`navigator.getUserMedia error:${e.toString()}`);
        }
        cameraBtn.setAttribute('state', 'on');
        cameraBtn.innerHTML = '关闭摄像头';
        startCameraRecording();
    } else {
        var stream = previewV1.srcObject;
        if (stream == null) return;
        const tracks = stream.getTracks();
        tracks.forEach(function (track) { track.stop(); });
        previewV1.srcObject = null;
        cameraBtn.setAttribute('state', 'off');
        cameraBtn.innerHTML = '开启摄像头';
        stopCameraRecording();
    }
});

screenBtn.addEventListener('click', async () => {
    if (screenBtn.getAttribute('state') == 'off') {
        try {
            streamScreen = await navigator.mediaDevices.getDisplayMedia({
                audio: {
                    audio: false
                },
                video: {
                    width: config.frame.width,
                    height: config.frame.height,
                    frameRate: config.frame.rate
                }
            });
            previewV2.srcObject = streamScreen;
        } catch (e) {
            console.log(`navigator.getUserMedia error:${e.toString()}`);
        }
        screenBtn.setAttribute('state', 'on');
        screenBtn.innerHTML = '停止共享';
        startScreenRecording();
    } else {
        var stream = previewV2.srcObject;
        if (stream == null) return;
        const tracks = stream.getTracks();
        tracks.forEach(function (track) { track.stop(); });
        previewV2.srcObject = null;
        screenBtn.setAttribute('state', 'off');
        screenBtn.innerHTML = '共享屏幕';
        stopScreenRecording();
    }
});

logoutBtn.addEventListener('click', () => {
    fetch('/logout', { method: 'POST' })
        .then(res => res.json())
        .then(msg => { location.reload(); })
        .catch((error) => { console.log(error); });
});

function startCameraRecording() {
    recordedBlobsCamera = [];
    const options = { 'mimeType': 'video/webm;codecs=vp9,opus' };
    try {
        if (previewV1.srcObject) {
            mediaRecorderCamera = new MediaRecorder(streamCamera, options);
            socketCamera = new WebSocket(config.wssurl + "/camera");
        }
    } catch (e) { return console.error(e); }
    mediaRecorderCamera.onstop = (event) => { };
    mediaRecorderCamera.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            recordedBlobsCamera.push(event.data);
            console.log("bufferCamera:", event.data.size);
            socketCamera.send(event.data);
        }
    };
    mediaRecorderCamera.start(1000);
}

function startScreenRecording() {
    recordedBlobsScreen = [];
    const options = { 'mimeType': 'video/webm;codecs=vp9,opus' };
    try {
        if (previewV2.srcObject) {
            mediaRecorderScreen = new MediaRecorder(streamScreen, options);
            socketScreen = new WebSocket(config.wssurl + "/screen");
        }
    } catch (e) { return console.error(e); }
    mediaRecorderScreen.onstop = (event) => { };
    mediaRecorderScreen.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            recordedBlobsScreen.push(event.data);
            console.log("bufferScreen:", event.data.size);
            socketScreen.send(event.data);
        }
    };
    mediaRecorderScreen.start(1000);
}

function stopCameraRecording() {
    socketCamera.close();
    mediaRecorderCamera.stop();
}

function stopScreenRecording() {
    socketScreen.close();
    mediaRecorderScreen.stop();
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/getconfig')
        .then(res => res.json())
        .then(msg => {
            config = msg;
            fetch('/getsid')
                .then(res => res.json())
                .then(msg => { config.wssurl += '/' + msg.sid; })
                .catch((err) => { console.log(err); });
        })
        .catch((err) => { console.log(err); });
}, false);

setInterval(() => {
}, 1000);

window.onunload = function () {
    socketCamera.close();
    socketScreen.close();
};
