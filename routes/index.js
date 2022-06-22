module.exports = (db_pool) => {
    var express = require('express');
    var router = express.Router();

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
                        where \`room_id\` = '${roomid}' and \`user_name\` = '${username}'`,
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
