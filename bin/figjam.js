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
		let {query} = source
		return Promise.all([
			this.loadObject(`${query.figroot || query.fig || ''}.figroot.json`, {reject: true}),
			this.loadObject(`${query.transfig || query.fig || ''}.transfig.json`,{reject: false}),
			this.loadObject(query.ctx || query, {reject: false})
		]).then(([figroot, transfig, ctx]) => {
			this.figroot = figroot
			this.transfig = transfig
			this.ctx = ctx
			console.log("FIGROOT", this.figroot)
			console.log("TRANSFIG", this.transfit)
			console.log("CTX", this.ctx)
			return ctxify(this.figroot, this.ctx)
		}) // when returned to Transflect, rejected promises close the connection with the error.
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
	loadObject(fig, options){
		if(Object.prototype.toString.call(fig) == '[object Object]'){
			return Promise.resolve(fig)
		} else {
			return new Promise((resolve, reject) => {
				if(url.parse(fig).protocol == 'http:'){ // if it looks like a URL...
					http.get(fig, response => {
						if(response.statusCode >= 300) reject('Bad Response')
						let buffers = []
						response.on('data', data => buffers.push(data))
						response.on('end', () => resolve(Buffer.concat(buffers)))
					})
				} else if(url.parse(fig).protocol == 'https:'){
					https.get(fig, response => {
						if(response.statusCode >= 300) reject('Bad Response')
						let buffers = []
						response.on('data', data => buffers.push(data))
						response.on('end', () => resolve(Buffer.concat(buffers)))
					})
				} else {
					// doesn't look like a web address (can't parse protocol)
					this.find(this.source.pathname, fig, (err, figfullpath) => {
						console.log("ERR", err)
						console.log("FIGFULLPATH", figfullpath)
						if(err)
							return options.reject ? reject(err) : resolve(null)
						// couldn't find it on the file system...
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
		console.log("pathname",pathname)
		console.log("basename", basename)
		fs.readdir(pathname, (err, entries) => {
			console.log(entries)
			if(err)
				callback(err)
			else if(entries.includes(basename))
				callback(null, path.resolve(pathname, basename))
			else
				if(pathname.length == '1') callback(new Error(`${basename} not found`))
				else this.find(pathname.replace(/\w+\/?$/,''), basename, callback)
		})
	}

}