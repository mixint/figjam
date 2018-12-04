const FigJam = require('../bin/figjam.js')
const BytePipette = require('@mixint/bytepipette')
const http = require('http')
const fs = require('fs')

http.createServer({
    IncomingMessage: require('parsedmessage'),
    ServerResponse: require('serverfailsoft'),
}, (req, res) => ((route) => {
	req.pipe(new route).pipe(res)
	console.log(req.connection.remoteAddress, req.method, req.url)
})(
	req.pathname.slice(-1) == '/' ? FigJam : BytePipette
)).listen(process.env.PORT || 3000)
/*
It should...

serve default fig and interpolate querystring

load alternate fig and interpolate querystring as ctx

load alternate fig and interpolate remote context (JSON response)

load remote fig and interpolate querystring as ctx

load remote fig and remote context


*/