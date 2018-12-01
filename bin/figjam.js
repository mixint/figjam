const Transflect = require('@mixint/transflect')
const ctxify = require('ctxify').ctxify
const fs = require('fs')
const url = require('url')
const path = require('path')
const http = require('http')
const https = require('https')

module.exports = class FigJam extends Transflect {
	constructor(){super()}

	_open(source){
		// check that I have access to the target directory...
		return Promise.all([
			this.loadObject(`${this.source.query.figroot || this.source.query.fig || ''}.figroot.json`),
			this.loadObject(`${this.source.query.transfig || this.source.query.fig || ''}.transfig.json`),
			this.loadObject(this.source.query.ctx || this.source.query)
		]).then(([figroot, transfig, ctx]) => {
			this.figroot = figroot
			this.transfig = transfig
			this.ctx = ctx
			return ctxify(this.figroot, this.ctx)
		}) // 
	}

	_end(done){
		done() // close connection on end unless an extension overrides _end...
	}

	ctxpush(data, done){
		// don't overwrite this._open ! just define a .figroot.json in ./conf/
		// I guess this is where I would inspect the object and look for that 'unique-key=pathname' to know when to send...
		// let element = Object.entries(this.transfig).pop() // reach into the attributes object of the top level {element: {attributes}} object
		// 							// TODO do I ever validate this.transfig? ctxify does...
		// let visibledivID = this.visibledivs[this.transfig[element]['unique-key']]
		// 	// check if the current object has an attribute by the name given by the unique-key attributes
		// 	// if so... hide the previous node cotaining that key.
		// if(visibledivID){
  //           this.push(ctxify({style: {
  //               ['#' + visibledivID]: {'display': 'none'}
  //           }})
		// }

        
  //       let id = `x${Math.random().toString(16).slice(2)}`

  //       let template = Object.assign({}, this.transfig, {
  //       	id: id
  //       })

		this.push(ctxify(this.transfig, data), done)
	}

	/**
	 * @param {(String|Object)} fig - an existing object or path to search for
	 * Note: Really the only reason to resolve back to an existing object 
	 * is so I can use loadObject as a promise whether or not query.ctx exists,
	 * in which case, I just fallback to the pathname query object as my context.
	 */
	loadObject(fig){
		if(Object.prototype.toString.call(fig) == '[object Object]'){
			return Promise.resolve(fig)
		} else {
			return new Promise((resolve, reject) => {
				if(url.parse(fig).protocol == 'http'){ // if it looks like a URL...
					http.get(fig, response => {
						let buffers = []
						response.on('data', data => buffers.push(data))
						response.on('end', () => resolve(Buffer.concat(buffers)))
					})
				} else if(url.parse(fig).protocol == 'https'){
					https.get(fig, response => {
						let buffers = []
						response.on('data', data => buffers.push(data))
						response.on('end', () => resolve(Buffer.concat(buffers)))
					})
				} else {
					this.find(this.source.pathname, fig, (err, figfullpath) => {
						if(err) reject(err)
						fs.readFile(figfullpath, (err, buffer) => {
							if(err) reject(err)
							else resolve(buffer)
						})
					})
				}
			}).then(buffer => new Promise((resolve, reject) => {
				try {
					resolve(JSON.parse(buffer))
				} catch(e){
					reject(e)
				}
			}))
		}
	}

	find(pathname, basename, callback){
		var pathparts = pathname.split('/')
		var extantfig = null
		var tryfig = null

		while(!extantfig && pathparts.length){
			try {
				tryfig = path.resolve(...pathparts, basename)
				console.log(tryfig)
				fs.accessSync(tryfig, fs.constants.R_OK) // if file isn't readable, catch!
				extantfig = tryfig
			} catch(e){
				pathparts.pop() // remove the trailing path section and try again
			}
		} // exit once extantfig has been defined OR ran out of path parts
		  // see if we still don't have a fig after this...
		if(!extantfig){
			// recursion base case - we've already tried figpath and local directory, no luck:
			if(pathname == process.env.figpath || pathname == './conf/') callback(new Error(`${basename} not found`))
			else this.find(process.env.figpath || './conf/', basename, callback)
		} else {
			// else we're done, pass the filepath to callback.
			callback(null, extantfig)
		}
	}

}