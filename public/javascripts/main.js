'use strict'

var mediaRecorder_camera;//media录制摄像头
var mediaRecorder_screen;//media录制屏幕


//let mediaRecorder;
let recordedBlobs_camera; // 录制下来的内容
let recordedBlobs_screen; // 录制下来的内容
let isRecording = false;

// 先把页面元素拿到
const startCameraBtn = document.querySelector('button#startCamera'); // 启动摄像头按钮
const stopCameraBtn = document.querySelector('button#stopCamera');
const recordBtn = document.querySelector('button#record'); // 开始录制按钮
const playBtn = document.querySelector('button#play');     // 播放按钮
const downloadBtn = document.querySelector('button#download'); // 下载视频按钮

const codecSelector = document.querySelector('#codecSelect'); // 选择格式
const msgEle = document.querySelector('span#msg');         // 显示消息
const previewV1 = document.querySelector('video#v1'); // 预览用的
const previewV2 = document.querySelector('video#v3'); // 预览用的
const recordedV1 = document.querySelector('video#v2');  // 用来播放录制好的视频
const recordedV2 = document.querySelector('video#v4');  // 用来播放录制好的视频

var stream_camera;
var stream_screen;
var socketCamera;
var socketScreen;

var showMsg = alert;

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
startCameraBtn.addEventListener('click', async () => {


    startCameraBtn.disabled = true;//按钮失效
    const isEchoCancellation = document.querySelector('#echoCancellation').checked;
    const constraints = {
        audio: {
            //echoCancellation: { exact: isEchoCancellation }
            audio: true
        },
        video: {
            width: 1280,
            height: 720,
            frameRate: 30
        }
    };
    await init(constraints);
});

async function init(constraints) {
    try {
        stream_camera = await navigator.mediaDevices.getUserMedia(constraints);
        stream_screen = await navigator.mediaDevices.getDisplayMedia(constraints);
        //const stream_screen = NULL;

        gotStream(stream_camera, stream_screen);
    } catch (e) {
        showMsg(`navigator.getUserMedia error:${e.toString()}`);
    }
}

function gotStream(stream_camera, stream_screen) {
    recordBtn.disabled = false;
    //showMsg('拿到了 stream:', stream);
    window.stream = stream_camera;
    window.stream = stream_screen;
    previewV1.srcObject = stream_camera;
    //previewV1.srcObject = stream_screen;

    // 重置
    var codecOption = codecSelector.lastChild;
    while (codecOption != null) {
        codecSelector.removeChild(codecOption);
        codecOption = codecSelector.lastChild;
    }

    getSupportedMimeTypes().forEach(mimeType => {
        const option = document.createElement('option');
        option.value = mimeType;
        option.innerText = option.value;
        codecSelector.appendChild(option);
    });
    codecSelector.disabled = false; // 可以进行选择了
}

stopCameraBtn.addEventListener('click', () => {
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
    codecSelector.disabled = true;
    startCameraBtn.disabled = false;
});


function startRecording() {
    recordedBlobs_camera = [];
    recordedBlobs_screen = [];
    const mimeType = 'video/webm;codecs=h264,opus';
    const options = { mimeType };

    try {
        mediaRecorder_camera = new MediaRecorder(stream_camera, options);
        mediaRecorder_screen = new MediaRecorder(stream_screen, options);
        socketCamera = new WebSocket(url + "/camera/" + user);//与服务器的连接
        socketScreen = new WebSocket(url + "/screen/" + user);
        setTimeout(() => {
            socketScreen.send('screen test');
        }, 50);
    } catch (e) {
        showMsg(`创建MediaRecorder出错: ${JSON.stringify(e)}`);
        return;
    }

    //showMsg('创建MediaRecorder', mediaRecorder_camera, ' -> options', options);
    recordBtn.textContent = '停止录制';
    isRecording = true;
    playBtn.disabled = true;
    downloadBtn.disabled = true;
    codecSelector.disabled = true;
    mediaRecorder_camera.onstop = (event) => {
        //showMsg('录制停止了: ' + event);
        //showMsg('录制的数据Blobs: ' + recordedBlobs);
    };
    mediaRecorder_camera.ondataavailable = handleDataAvailable1;
    mediaRecorder_camera.start(1000);
    mediaRecorder_screen.ondataavailable = handleDataAvailable2;
    mediaRecorder_screen.start(1000);
    //showMsg('录制开始 mediaRecorder: ' + mediaRecorder_screen);
}

function stopRecording() {
    mediaRecorder_camera.stop();
    mediaRecorder_screen.stop();
    socketCamera.close();
    socketScreen.close();
}

function handleDataAvailable1(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs_camera.push(event.data);
        console.log("bufferCamera:")
        console.log(event.data.size)
        // sendMsg();
        socketCamera.send(event.data);
    }
}

function handleDataAvailable2(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs_screen.push(event.data);
        console.log("bufferScreen:")
        //console.log(bufferScreen)
        // sendMsg();
        socketScreen.send(event.data);
    }
}

recordBtn.addEventListener('click', () => {
    if (isRecording == false) {
        startRecording();
    } else {
        stopRecording();
        recordBtn.textContent = '开始录制';
        playBtn.disabled = false;
        downloadBtn.disabled = false;
        codecSelector.disabled = false;
    }
});

playBtn.addEventListener('click', () => {
    const mimeType = codecSelector.options[codecSelector.selectedIndex].value.split(';', 1)[0];
    const superBuffer = new Blob(recordedBlobs_camera, { type: mimeType });
    recordedV2.src = null;
    recordedV2.srcObject = null;
    recordedV2.src = window.URL.createObjectURL(superBuffer);
    recordedV2.controls = true;
    recordedV2.play();


    const superBuffer1 = new Blob(recordedBlobs_screen, { type: mimeType });
    recordedV1.src = null;
    recordedV1.srcObject = null;
    recordedV1.src = window.URL.createObjectURL(superBuffer1);
    recordedV1.controls = true;
    recordedV1.play();
});


downloadBtn.addEventListener('click', () => {

    const blob = new Blob(recordedBlobs_camera, { type: 'video/webm' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = '视频1_' + new Date().getTime() + '.webm';
    document.body.appendChild(a);
    a.click();


    const blob1 = new Blob(recordedBlobs_camera, { type: 'video/webm' });
    const url1 = window.URL.createObjectURL(blob1);
    const a1 = document.createElement('a');
    a1.style.display = 'none';
    a1.href = url1;
    a1.download = '视频2_' + new Date().getTime() + '.webm';
    document.body.appendChild(a1);
    a1.click();



    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a1);
        window.URL.revokeObjectURL(url1);

    }, 100);
});

window.onunload = function () {
    socketCamera.close();
    socketScreen.close();
};
