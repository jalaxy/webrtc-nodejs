module.exports = (db_pool) => {
    var createError = require('http-errors');
    var express = require('express');
    var path = require('path');
    var session = require('express-session');
    var mysqlStore = require('express-mysql-session')(session);
    var cookieParser = require('cookie-parser');
    var logger = require('morgan');

    var app = express();
    var sessionStore = new mysqlStore({
        createDatabaseTable: false,
        schema: {
            tableName: 'sessions',
            columnNames: {
                session_id: 'session_id',
                expires: 'expires',
            }
        }
    }, db_pool);

    app.use(session({
        secret: "meeting-project-of-comnet-using-webrtc",
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 3600 },
        resave: false,
        store: sessionStore
    }));

    var indexRouter = require('./routes/index')(db_pool);
    var usersRouter = require('./routes/users');

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', indexRouter);
    app.use('/users', usersRouter);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        next(createError(404));
    });

    // error handler
    app.use(function (err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });

    return app;
}