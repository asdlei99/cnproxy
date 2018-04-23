const fs =require('fs')
const mime =require('mime')
const path = require('path')
const log = require('../../common/log')
const utils = require('../../common/utils')

/**
 * respond the request following the algorithm
 * 
 * 1. Read the file content according to the configured src list 
 * 2. Concat them into a file
 * 3. Respond the file to the request
 * 
 * @param {Object} options dir and source file lists
 *                 {dir: String, src: Array}
 * @param {Object} req request
 * @param {Object} res response
 * @param {Object} next next 
 */
function respondFromCombo(options, req, res, next){
  let dir
  let src

  if(typeof options !== 'object' || typeof options === null){
    log.warn('Options are invalid when responding from combo!')
    next()
  }

  dir = typeof options.dir === 'undefined' ? null : options.dir
  src = Array.isArray(options.src) ? options.src : []

  if(dir !== null){
    try{
      fs.statSync(dir)
    }catch(e){
      throw e
    }

    src = src.map(function(file){
      return path.join(dir, file)
    })
  }

  //Read the local files and concat together
  if(src.length > 0){
    utils.concat(src, function(err, data){
      if(err){ throw err }
        res.statusCode = 200

        res.setHeader('Content-Length', data.length)
        res.setHeader('Content-Type', mime.lookup(src[0]))
        res.setHeader('Server', 'CNProxy')

        res.write(data)
        res.end()
    })
  }
}

module.exports = respondFromCombo