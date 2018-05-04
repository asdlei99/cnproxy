const http = require('http')
const https = require('https')
const log = require('../common/log')
const commonUtil = require('../common/utils')

// create requestHandler function
module.exports = function createRequestHandler(requestInterceptor, responseInterceptor, middlewares, externalProxy) {

    return function requestHandler(req, res, ssl) {

        let proxyReq

        let rOptions = commonUtil.getOptionsFormRequest(req, ssl, externalProxy)

        if (rOptions.headers.connection === 'close') {
            req.socket.setKeepAlive(false)
        } else if (rOptions.customSocketId !== null) {
            req.socket.setKeepAlive(true, 60 * 60 * 1000)
        } else {
            req.socket.setKeepAlive(true, 30000)
        }

        let requestInterceptorPromise = () => {
            return new Promise((resolve, reject) => {

                let next = () => {
                    resolve()
                }

                let url = commonUtil.processUrl(req, rOptions)
                log.debug('respond: ' + url)

                let respondObj, originalPattern, responder, pattern
                for (let i = 0, len = middlewares.length; i < len; i++) {
                    respondObj = middlewares[i]
                    originalPattern = respondObj.pattern
                    responder = respondObj.responder

                    // adapter pattern to RegExp object
                    if (typeof originalPattern !== 'string' && !(originalPattern instanceof RegExp)) {
                        log.error()
                        throw new Error('pattern must be a RegExp Object or a string for RegExp')
                    }

                    pattern = typeof originalPattern === 'string' ? new RegExp(originalPattern) : originalPattern

                    if (pattern.test(url)) {
                        log.debug('匹配:' + originalPattern)
                        break
                    }
                }

                try {
                    if (typeof requestInterceptor === 'function') {
                        requestInterceptor.call(null, rOptions, req, res, ssl, next)
                    } else {
                        resolve()
                    }
                } catch (e) {
                    reject(e)
                }
            })
        }

        let proxyRequestPromise = () => {
            return new Promise((resolve, reject) => {

                rOptions.host = rOptions.hostname || rOptions.host || 'localhost'

                // use the binded socket for NTLM
                if (rOptions.agent && rOptions.customSocketId != null && rOptions.agent.getName) {
                    let socketName = rOptions.agent.getName(rOptions)
                    let bindingSocket = rOptions.agent.sockets[socketName]
                    if (bindingSocket && bindingSocket.length > 0) {
                        bindingSocket[0].once('free', onFree)
                        return
                    }
                }
                onFree()

                function onFree() {
                    proxyReq = (rOptions.protocol === 'https:' ? https : http).request(rOptions, (proxyRes) => {
                        resolve(proxyRes)
                    })
                    proxyReq.on('timeout', () => {
                        reject(`${rOptions.host}:${rOptions.port}, request timeout`)
                    })

                    proxyReq.on('error', (e) => {
                        reject(e)
                    })

                    proxyReq.on('aborted', () => {
                        reject('server aborted reqest')
                        req.abort()
                    })

                    req.on('aborted', function () {
                        proxyReq.abort()
                    })
                    req.pipe(proxyReq)

                }

            })
        }

        // workflow control
        (async () => {

            await requestInterceptorPromise()

            if (res.finished) {
                return false
            }

            let proxyRes = await proxyRequestPromise()


            let responseInterceptorPromise = new Promise((resolve, reject) => {
                let next = () => {
                    resolve()
                }
                try {
                    if (typeof responseInterceptor === 'function') {
                        responseInterceptor.call(null, req, res, proxyReq, proxyRes, ssl, next)
                    } else {
                        resolve()
                    }
                } catch (e) {
                    reject(e)
                }
            })

            await responseInterceptorPromise

            if (res.finished) {
                return false
            }

            try {
                if (!res.headersSent) {
                    Object.keys(proxyRes.headers).forEach(function (key) {
                        if (proxyRes.headers[key] !== undefined) {
                            if (/^www-authenticate$/i.test(key)) {
                                if (proxyRes.headers[key]) {
                                    proxyRes.headers[key] = proxyRes.headers[key] && proxyRes.headers[key].split(',')
                                }
                                key = 'www-authenticate'
                            }
                            res.setHeader(key, proxyRes.headers[key])
                        }
                    })

                    res.writeHead(proxyRes.statusCode)
                    proxyRes.pipe(res)
                }
            } catch (e) {
                throw e
            }
        })().then((flag) => {
            },
            (e) => {
                if (!res.finished) {
                    res.writeHead(500)
                    res.write(`CNProxy Warning:\n\n ${e.toString()}`)
                    res.end()
                }
                console.error(e)
            }
        )
    }
}