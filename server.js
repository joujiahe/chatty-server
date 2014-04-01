var port   = process.env.PORT,
    http   = require('http'),
    redis  = require('redis'),
    sub    = redis.createClient(),
    pub    = redis.createClient(),
    sockjs = require('sockjs'),
    chatty = sockjs.createServer();

var parse = JSON.parse,
    stringify = JSON.stringify;

sub.subscribe('chatty');

chatty.on('connection', function(conn) {
    var subChannel;

    conn.on('data', function(message) {
        var _msg = parse(message);

        switch(_msg.type) {
        case 'subscribe':
            subChannel = _msg.channel;
            pub.incr(subChannel);
            pubUserCount();
            break;
        default:
            pub.publish('chatty', message);
        }
    });

    sub.on('message', function(channel, message) {
        var _msg = parse(message);

        if (_msg.channel == subChannel)
            conn.write(message)
    });

    pub.incr('total_count');
    conn.on('close', function() {
        pub.decr('total_count');
        pub.decr(subChannel);
        pubUserCount();
    });

    function pubUserCount() {
        pub.get(subChannel, function(err, val) {
            pub.publish('chatty', stringify({
                channel: subChannel,
                type: 'count',
                count: val
            }));
        });
    }
});

var server = http.createServer();
chatty.installHandlers(server);

server.listen(port);