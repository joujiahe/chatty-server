var fork = require('child_process').fork;

for (var i = 0; i <= 2; i++) {
    var child = fork(__dirname + '/server', [], {env: {PORT: 8080 + i}});
}