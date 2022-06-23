'use strict'

var config;

var mediaRecorderCamera; // media录制摄像头
var mediaRecorderScreen; // media录制屏幕

// 先把页面元素拿到
const cameraBtn = document.querySelector('button#camera-button'); // 启动摄像头按钮
const screenBtn = document.querySelector('button#screen-button');
const logoutBtn = document.querySelector('button#logout-button');
var displayElements = [];

var streamCamera;
var streamScreen;
var socketCamera;
var socketScreen;

var videosNum;

// 启动摄像头
cameraBtn.addEventListener('click', async () => {
    if (cameraBtn.getAttribute('state') == 'off') {
        try {
            streamCamera = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    width: config.frame.width,
                    height: config.frame.height,
                    frameRate: config.frame.rate
                }
            });
        } catch (e) {
            console.log(`navigator.getUserMedia error:${e.toString()}`);
        }
        cameraBtn.setAttribute('state', 'on');
        cameraBtn.innerHTML = '关闭摄像头';
        startCameraRecording();
        fetch('/startcamera', { method: 'POST' })
            .catch((err) => { console.log(err); });
    } else {
        if (streamCamera == null) return;
        const tracks = streamCamera.getTracks();
        tracks.forEach(function (track) { track.stop(); });
        streamCamera = null;
        cameraBtn.setAttribute('state', 'off');
        cameraBtn.innerHTML = '开启摄像头';
        mediaRecorderCamera.stop();
        fetch('/endcamera', { method: 'POST' })
            .catch((err) => { console.log(err); });
    }
    updateDisplay();
});

screenBtn.addEventListener('click', async () => {
    if (screenBtn.getAttribute('state') == 'off') {
        try {
            streamScreen = await navigator.mediaDevices.getDisplayMedia({
                audio: false,
                video: {
                    width: config.frame.width,
                    height: config.frame.height,
                    frameRate: config.frame.rate
                }
            });
        } catch (e) {
            console.log(`navigator.getUserMedia error:${e.toString()}`);
        }
        screenBtn.setAttribute('state', 'on');
        screenBtn.innerHTML = '停止共享';
        startScreenRecording();
        fetch('/startscreen', { method: 'POST' })
            .catch((err) => { console.log(err); });
    } else {
        if (streamScreen == null) return;
        const tracks = streamScreen.getTracks();
        tracks.forEach(function (track) { track.stop(); });
        streamScreen = null;
        screenBtn.setAttribute('state', 'off');
        screenBtn.innerHTML = '共享屏幕';
        mediaRecorderScreen.stop();
        fetch('/endscreen', { method: 'POST' })
            .catch((err) => { console.log(err); });
    }
    updateDisplay();
});

logoutBtn.addEventListener('click', () => {
    fetch('/logout', { method: 'POST' })
        .then(res => res.json())
        .then(msg => { location.reload(); })
        .catch((error) => { console.log(error); });
});

function startCameraRecording() {
    try {
        if (streamCamera) {
            mediaRecorderCamera = new MediaRecorder(streamCamera,
                { 'mimeType': 'video/webm;codecs=vp9,opus' });
            socketCamera = new WebSocket(config.wssurl + "/camera");
        }
    } catch (e) { return console.error(e); }
    mediaRecorderCamera.onstop = (event) => { };
    mediaRecorderCamera.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            console.log("bufferCamera:", event.data.size);
            socketCamera.send(event.data);
        }
    };
    mediaRecorderCamera.start(1000);
}

function startScreenRecording() {
    try {
        if (streamScreen) {
            mediaRecorderScreen = new MediaRecorder(streamScreen,
                { 'mimeType': 'video/webm;codecs=vp9,opus' });
            socketScreen = new WebSocket(config.wssurl + "/screen");
        }
    } catch (e) { return console.error(e); }
    mediaRecorderScreen.onstop = (event) => { };
    mediaRecorderScreen.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            console.log("bufferScreen:", event.data.size);
            socketScreen.send(event.data);
        }
    };
    mediaRecorderScreen.start(1000);
}

function createSubVideoElement() {
    var e = document.createElement('div');
    e.classList.add('sub-video');
    e.append(document.createElement('div'));
    e.firstElementChild.classList.add('video-container');
    e.firstElementChild.appendChild(document.createElement('video'));
    e.firstElementChild.firstElementChild.classList.add('video');
    e.firstElementChild.firstElementChild.setAttribute('playsinline', '');
    e.firstElementChild.firstElementChild.setAttribute('autoplay', '');
    e.firstElementChild.firstElementChild.setAttribute('muted', '');
    return e;
}

function updateDisplay() {
    fetch('/getvideonum')
        .then(res => res.json())
        .then(data => {
            var multiVideo = document.querySelector('div#multi-video');
            multiVideo.innerHTML = '';
            videosNum = data.num;
            var displayNum = videosNum;
            if (streamCamera) displayNum++;
            if (streamScreen) displayNum++;
            for (var i = 0; i < displayNum - 1; i++)
                multiVideo.appendChild(createSubVideoElement());
            videos.appendChild(multiVideo);
            displayElements = [];
            displayElements.push(document.querySelector('div#main-video')
                .firstElementChild.firstElementChild);
            for (var i = 0; i < displayNum - 1; i++)
                displayElements.push(document.querySelector('div#multi-video')
                    .children[i].firstElementChild.firstElementChild);
            var j = 0;
            if (streamCamera) {
                displayElements[j].innerHTML = '';
                displayElements[j].srcObject = streamCamera;
                j++;
            }
            if (streamScreen) {
                displayElements[j].innerHTML = '';
                displayElements[j].srcObject = streamScreen;
                j++;
            }
            for (var i = 0; i < videosNum; i++) {
                var src = document.createElement('source');
                src.setAttribute('src', `/video/${i}`);
                src.setAttribute('type', 'video/webm');
                displayElements[j].appendChild(src);
                j++;
            }
        });
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/getconfig')
        .then(res => res.json())
        .then(msg => {
            config = msg;
            fetch('/getsid').then(res => res.json())
                .then(msg => { config.wssurl += '/' + msg.sid; })
                .catch((err) => { console.log(err); });
        }).catch((err) => { console.log(err); });
    const videos = document.querySelector('div#videos');
    var mainVideo = document.createElement('div');
    mainVideo.id = 'main-video';
    var multiVideo = document.createElement('div');
    multiVideo.id = 'multi-video';
    mainVideo.appendChild(document.createElement('div'));
    mainVideo.firstElementChild.classList.add('video-container');
    mainVideo.firstElementChild.appendChild(document.createElement('video'));
    mainVideo.firstElementChild.firstElementChild.classList.add('video');
    mainVideo.firstElementChild.firstElementChild.setAttribute('muted', '');
    mainVideo.firstElementChild.firstElementChild.setAttribute('playsinline', '');
    mainVideo.firstElementChild.firstElementChild.setAttribute('autoplay', '');
    videos.appendChild(mainVideo);
    videos.appendChild(multiVideo);
    updateDisplay();
}, false);

setInterval(() => {
    fetch('/getvideonum')
        .then(res => res.json())
        .then(data => {
            if (data.num != videosNum)
                updateDisplay();
        });
}, 1000);
