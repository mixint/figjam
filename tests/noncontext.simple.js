const FigJam = require('../bin/figjam.js')
const http = require('http')
const fs = require('fs')

http.createServer({
    IncomingMessage: require('parsedmessage'),
    ServerResponse: require('serverfailsoft'),
}, (req, res) => {
	req.pipe(new FigJam).pipe(res)
}).listen(process.env.PORT || 3000)