const fs = require('fs')
const path = require('path')
const mime = require('mime')
const responders = require('./responders/index')
const utils = require('../common/utils')
const log = require('../common/log')

const httpRxg = /^http/
const imgRxg = /(\.(img|png|gif|jpg|jpeg))$/i

/**
 * Respond to the request with the specified responder if the url
 * matches the defined url pattern from the responder list file.
 * The following three kinds of responders are supported.
 * 1. Single file (from local or internet)
 * 2. Combo file
 * 3. Directory Mapping
 * 4. custom function(for other combo cases)(TODO)
 *
 * @param {String} responderListFilePath
 */
function respond(responderListFilePath, cookies) {
    let responderList = _loadResponderList(responderListFilePath)

    //watch the rule file
    _watchRuleFile(responderListFilePath, function () {
        responderList = _loadResponderList(responderListFilePath)
    })

    return function respond(req, res, next) {
        let url = utils.processUrl(req)
        let pattern // url pattern
        let originalPattern
        let responder
        let matched = false
        let respondObj
        let stat

        /**
         * For directory mapping
         */
        let extDirectoryOfRequestUrl
        let localDirectory


        let imgFileBasePath

        log.debug('respond: ' + url)

        for (let i = 0, len = responderList.length; i < len; i++) {
            respondObj = responderList[i]
            originalPattern = respondObj.pattern
            responder = respondObj.responder

            // adapter pattern to RegExp object
            if (typeof originalPattern !== 'string' && !(originalPattern instanceof RegExp)) {
                log.error()
                throw new Error('pattern must be a RegExp Object or a string for RegExp')
            }

            pattern = typeof originalPattern === 'string' ? new RegExp(originalPattern) : originalPattern

            if (pattern.test(url)) {
                log.info('匹配到URL: ' + url)

                matched = true
                if (respondObj.cookies) {
                    req.headers.cookie = respondObj.cookies
                }
                if (cookies) {
                    req.headers.cookie = cookies
                }
                log.debug('before fix responder: ' + responder)

                responder = fixResponder(url, pattern, responder)

                log.debug('after fix responder: ' + responder)

                if (typeof responder === 'string') {

                    if (httpRxg.test(responder)) {
                        responders.respondFromWebFile(responder, req, res, next)
                    } else {
                        fs.stat(responder, function (err, stat) {
                            if (err) {
                                log.error(err.message + 'for (' + url + ')' +
                                    ' then directly forward it!')
                                next()
                            } else {
                                if (stat.isFile()) { // local file
                                    responders.respondFromLocalFile(responder, req, res, next)
                                } else if (stat.isDirectory()) { // directory mapping
                                    let urlWithoutQS = utils.processUrlWithQSAbandoned(url)
                                    let directoryPattern = url.match(pattern)[0]
                                    extDirectoryOfRequestUrl = urlWithoutQS.substr(
                                        urlWithoutQS.indexOf(directoryPattern) + directoryPattern.length)
                                    localDirectory = path.join(responder,
                                        path.dirname(extDirectoryOfRequestUrl))

                                    utils.findFile(localDirectory,
                                        path.basename(extDirectoryOfRequestUrl),
                                        function (err, file) {
                                            log.debug('Find local file: ' + file + ' for (' + url + ')')
                                            if (err) {
                                                log.error(err.message + ' for (' + url + ')' +
                                                    ' then directly forward it!')
                                                next()
                                            } else {
                                                responders.respondFromLocalFile(file, req, res, next)
                                            }
                                        })
                                }
                            }
                        })
                    }
                } else if (Array.isArray(responder)) {
                    responders.respondFromCombo({
                        dir: null,
                        src: responder
                    }, req, res, next)
                } else if (typeof responder === 'object' && responder !== null) {
                    responders.respondFromCombo({
                        dir: responder.dir,
                        src: responder.src
                    }, req, res, next)
                } else {
                    log.error('Responder for ' + url + 'is invalid!')
                    next()
                }

                break
            }
        }

        if (!matched) {

            // log.info('forward: ' + url)
            next()
        }
    }
}

/**
 * For some responder with regular expression letiable like $1, $2,
 * it should be replaced with the actual value
 *
 * @param {Regular Express Object} pattern matched array
 * @param {String} responder, replaced string
 */
function fixResponder(url, pattern, responder) {
    let $v = /\$\d+/g
    let m
    let newRx
    if (!$v.test(responder)) {
        return responder
    }

    m = url.match(pattern)

    if (!Array.isArray(m)) {
        return responder
    }

    for (let i = 0, l = m.length; i < l; i++) {
        newRx = new RegExp('\\$' + i, 'g')
        responder = responder.replace(newRx, m[i])
    }

    return responder
}



module.exports = respond
