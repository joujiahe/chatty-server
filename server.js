var port   = process.env.PORT,
    http   = require('http'),
    redis  = require('redis'),
    sub    = redis.createClient(),
    pub    = redis.createClient(),
    sockjs = require('sockjs'),
    chatty = sockjs.createServer();

var stringify = JSON.stringify;

sub.subscribe('chatty');

chatty.on('connection', function(conn) {
    conn.on('data', function(message) {
        pub.publish('chatty', message);
    });

    sub.on('message', function(channel, message) {
        conn.write(message)
    });

    conn.on('close', function() {
        pub.decr('user_count');
        pubUserCount();
    });

    pub.incr('user_count');
    pubUserCount();
});

var pubUserCount = pub.get.bind(pub, 'user_count', function(err, val) {
        pub.publish('chatty', stringify({
            type: 'count',
            count: val
        }));
    });

var server = http.createServer();
chatty.installHandlers(server);

server.listen(port);