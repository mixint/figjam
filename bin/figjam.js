const Transflect = require('@mixint/transflect')
const http = require('http')
const https = require('https')

module.exports = class FigJam extends Transflect {
	constructor(){super()}

	// resolves locally to the module, extensions will load their own default.
	// right now returns just the one named exactly, in the future,
	// could do a readdir and return the most likely one: most recent file saved by uid
	get figroot(query){
		return `${this.source.query.figroot || this.source.query.fig || ''}.figroot.json`
	}

	get transfig(){
		return this._transfig = this._transfig || this.loadObject(
			`${this.source.query.transfig || this.source.query.fig || ''}.transfig.json`
		)
			// should I check that this exists? do I want to default ? 
			// I'll just throw an error if you specify nonexistant file.
			// resolves locally to the module, extensions will load their own default.
	}

	loadObject(figname){
		// decide if pathname looks like a url, (has protocol)
		return new Promise((resolve, reject) => {
			if(!figname) resolve({}) // resolve to empty object if called on undefined param
			else if(url.query(figname).protocol == 'http'){ // if it looks like a URL...
				http.get(figname, response => {
					let buffers = []
					response.on('data', data => buffers.push(data))
					response.on('end', () => resolve(Buffer.concat(buffers).toString()))
				})
			} else if(url.query(figname).protocol == 'https'){
				https.get(figname, response => {
					let buffers = []
					response.on('data', data => buffers.push(data))
					response.on('end', () => resolve(Buffer.concat(buffers).toString()))
				})
			} else {
				this.find(figname, (err, figfullpath) => {
					fs.readFile(figfullpath, (err, buffer) => {
						if(err) reject(err)
						else resolve(buffer.toString())
					})
				})
			}
		}).then(textContents => new Promise((resolve, reject) => {
			try {
				resolve(JSON.parse(textContents))
			} catch(e){
				reject(e)
			}
		}))
	}

	find(pathname, basename, callback){
		var pathparts = source.pathname.split('/')
		var extantfig = null
		var tryfig = null

		while(!extantfig && pathparts.length){
			try {
				tryfig = path.resolve('/', ...pathparts, basename)
				fs.accessSync(tryfig, fs.constants.R_OK) // if file isn't readable, catch!
				extantfig = tryfig
			} catch(e){
				pathparts.pop() // remove the trailing path section and try again
			}
		} // exit once extantfig has been defined OR ran out of path parts
		  // see if we still don't have a fig after this...
		if(!extantfig){
			// recursion base case - we've already tried figpath and local directory, no luck:
			if(pathname == process.env.figpath || '.') callback(new Error(`${basename} not found`))
			else this.find(process.env.figpath || '.', basename, callback)
		} else {
			// else we're done, pass the filepath to callback.
			callback(null, extantfig)
		}
	}

	_open(source){
		// check that I have access to the target directory...
		return promiseAccess(source.pathname).then(() => 
			new Promise(resolve => {

				Promise.all([
					this.loadObject(this.figroot),
					this.loadObject(this.transfig),
					this.loadObject(source.query.ctx || source.query)
				]).then([figrootObj, transfigObj, ctxObj] => {

				})

				if(url.parse(source.query.ctx || '')
				// check if there is a ctx 
				try {
					url.parse(source.query.ctx)
				} catch(e){
					// there is no ctx...
				}

				try {
					url.parse(source.query.fig)
				}

				source.query.ctx
				source.query.fig / figroot / transfig



				// well I'm inside a promise so I could iterate throug a promise loop to be nonblocking but, not a priority

				// if that never works, then fallback to local...


				// check for figroot=figleaf=transfig= in the current directory, 
				// should all these confs be present at the top of the cwd?
				// or available via some kind of path? 
				// maybe... I check all the complete pathnames implied by the pathname
				// going to higher directories to get default figs.
				// .figroot.json could exist in your home directory,
				// every directory inside your home folder will look like how you want it.

				source.query.fig
				source.query.figroot = 'name'figroot.json
				source.query.transfig

			}))

		// search pathname directory for fig.jsons
		// select most recent file owned by user
		// render the fig as html
	}

	_end(done){
		if(!this.keepAlive){
			done() // make sure ending the request destroyed the statstream 
		}
		// else never close the connection
	}

	ctxpush(data, done){
		this.push(ctxify(this.transfig, data), done)
	}

}