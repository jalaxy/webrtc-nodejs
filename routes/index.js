'use strict';

module.exports = (db_pool) => {
    var express = require('express');
    var router = express.Router();
    var config = require('../config');
    var cameraSessions = new Set();
    var screenSessions = new Set();
    var fs = require('fs');
    var path = require('path');

    router.get('/getconfig', (req, res, next) => { res.send(config()); });

    router.get('/getsid', (req, res, next) => { res.send({ 'sid': req.sessionID }); });

    router.get('/getvideonum', (req, res, next) => {
        var num = cameraSessions.size + screenSessions.size;
        if (cameraSessions.has(req.sessionID)) num--;
        if (screenSessions.has(req.sessionID)) num--;
        res.send({ 'num': num });
    });

    router.post('/startscreen', (req, res, next) => { screenSessions.add(req.sessionID); });

    router.post('/startcamera', (req, res, next) => { cameraSessions.add(req.sessionID); });

    router.post('/endscreen', (req, res, next) => { screenSessions.delete(req.sessionID); });

    router.post('/endcamera', (req, res, next) => { cameraSessions.delete(req.sessionID); });

    router.post('/logout', (req, res, next) => {
        req.session.destroy();
        res.send({});
    });

    /* GET home page. */
    router.get('/', function (req, res, next) {
        res.render('index');
    });

    router.post('/', function (req, res, next) {
        var roomid = req.body['roomid'];
        var passwd = req.body['passwd'];
        var username = req.body['username'];
        if (roomid == '')
            res.send({ "mC": "请输入会议号", "mE": "Please input room ID" });
        else db_pool.query(
            `select \`passwd\` from \`room\` where \`room_id\` = '${roomid}'`,
            (err, rows) => {
                if (err) throw (err);
                if (rows.length == 0)
                    res.send({ 'mC': "会议号不存在", 'mE': 'Room not found' });
                else if (passwd == rows[0]['passwd']) {
                    res.send({ 'mC': '成功', 'mE': 'Success' });
                    db_pool.query(`select * from \`login\` \
                        where \`room_id\` = '${roomid}' and \`session_id\` = '${req.sessionID}'`,
                        (err, rows) => {
                            if (err) throw err;
                            if (rows.length == 0)
                                db_pool.query(
                                    `insert into \`login\`(\`room_id\`, \`session_id\`, \`user_name\`) \
                                    values('${roomid}', '${req.sessionID}', '${username}')`,
                                    (err) => {
                                        if (err) throw (err);
                                    }); else {
                                ; // login again, maybe update something
                            }
                        });
                } else res.send({ 'mC': '密码错误', 'mE': 'Wrong password' });
            });
    });

    router.get('/room/:roomid', function (req, res, next) {
        db_pool.query(
            `select count(*) as cnt from \`login\` where \`room_id\` = '${req.params.roomid}' \
            and \`session_id\` = '${req.sessionID}'`,
            (err, rows) => {
                if (err) throw err;
                if (rows[0]['cnt'] == 0)
                    res.redirect('/');
                else
                    res.render('room');
            });
    });

    router.get('/admin', function (req, res, next) {
        db_pool.query(
            `select * as users from \`login\` where \`stu_userlevel\` = 0 \
                and \`stu_enable\` = 1`,
            (err, rows) => {
                if (err) throw err;
                res.render('admin', users = users);
            });
    });

    router.get('/video/:videoid', (req, res, next) => {
        const range = req.headers.range;
        if (!range) { res.status(400).send("Requires Range header"); }
        var videoPath;
        var cameraSIDs = cameraSessions, screenSIDs = screenSessions;
        var videoid = Number(req.params.videoid);
        cameraSIDs.delete(req.sessionID);
        screenSIDs.delete(req.sessionID);
        if (videoid < screenSIDs.size) {
            var order = Array.from(screenSIDs.values());
            order.sort();
            videoPath = path.join(config().rootdir, order.at(videoid), "screen.webm");
        } else {
            var order = Array.from(cameraSIDs.values());
            order.sort();
            videoid -= cameraSIDs.size;
            videoPath = path.join(config().rootdir, order.at(videoid), "camera.webm");
        }
        const videoSize = fs.statSync(videoPath).size;
        const CHUNK_SIZE = 10 ** 5;
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        };
        res.writeHead(206, headers);
        const videoStream = fs.createReadStream(videoPath, { start, end });
        videoStream.pipe(res);
    });

    return router;
}


// pool.getConnection((err, conn) => {
//     conn.query('select 1 + 1 as `solution`', (err, rows) => {
//         if (err) throw (err);
//         console.log('The solution is: ', rows[0].solution);
//     })
//     conn.release();
// });

// pool.query('select 1 + 1 as `solution`', (err, rows) => {
//     if (err) throw (err);
//     console.log('The solution is: ', rows[0].solution);
// });
