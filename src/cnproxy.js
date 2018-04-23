const fs = require('fs')
const http = require('http')
const log = require('./common/log')
const utils = require('./common/utils')
const tlsUtils = require('./tls/tlsUtils')

const createRequestHandler = require('./proxy/createRequestHandler')
const createConnectHandler = require('./proxy/createConnectHandler')
const createFakeServerCenter = require('./proxy/createFakeServerCenter')
const createUpgradeHandler = require('./proxy/createUpgradeHandler')


const DEFAULT_PORT = 9010

let httpServer

/**
 * Start up cnproxy server on the specified port
 * and combine the processors defined as connect middlewares into it.
 *
 * @param {String} port the port proxy server will listen on
 * @param {Object} options options for the middlewares
 */
function cnproxy({port, config, timeout, debug, networks, watch}) {

    port = typeof port === 'number' ? port : DEFAULT_PORT

    let configuration = !watch ? utils.loadConfiguration(config) : null

    if (configuration) {
        utils.watchConfiguration(config, () => {
            configuration = utils.loadConfiguration(config)
        })
    }

    let getCertSocketTimeout = timeout || 1000

    if (typeof debug === 'boolean') {
        log.isDebug = debug
    }

    let middlewares = []
    let externalProxy = null
    // 判断该请求是否需要代理
    let sslConnectInterceptor = (clientReq, clientSocket, head) => true
    // 请求拦截器
    let requestInterceptor = (rOptions, req, res, ssl, next) => next()
    // 响应拦截器
    let responseInterceptor = (req, res, proxyReq, proxyRes, ssl, next) => next()

    if (watch) {
        let pattern = typeof watch === 'string' ? new RegExp(watch) : watch
        sslConnectInterceptor = (clientReq, clientSocket, head) => {
            let url = utils.getFullUrl(clientReq)
            // console.log('sslConnectInterceptor', url, pattern.test(url))
            return pattern.test(url)
        }
        requestInterceptor = (requestOptions, clientReq, clientRes, ssl, next) => {
            let url = utils.getFullUrl(clientReq)
            // console.log('requestInterceptor', url, pattern.test(url))
            if (pattern.test(url)) {
                console.log('\n')
                log.info('[URL]:' + url)
                log.info('[METHOD]:' + requestOptions.method)
                if (requestOptions.headers.cookie) {
                    log.info('[COOKIE]:' + requestOptions.headers.cookie)
                }
                if (requestOptions.headers['user-agent']) {
                    log.info('[USER_AGENT]:' + requestOptions.headers['user-agent'])
                }
            }
            next()
        }
    }


    let rs = tlsUtils.initCA()
    let caKeyPath = rs.caKeyPath
    let caCertPath = rs.caCertPath

    let requestHandler = createRequestHandler(
        requestInterceptor,
        responseInterceptor,
        middlewares,
        externalProxy
    )

    let upgradeHandler = createUpgradeHandler()

    let fakeServersCenter = createFakeServerCenter({
        caCertPath,
        caKeyPath,
        requestHandler,
        upgradeHandler,
        getCertSocketTimeout
    })

    let connectHandler = createConnectHandler(
        sslConnectInterceptor,
        fakeServersCenter
    )

    let server = new http.Server();
    server.listen(port, () => {
        log.info(`CNProxy 启动成功 端口号: ${port}!`)

        if (networks) {
            log.info('Network interfaces:');
            let interfaces = require('os').networkInterfaces();
            for (let key in interfaces) {
                log.info(key)
                interfaces[key].forEach((item) => {
                    log.info('  ' + item.address + '\t' + item.family);
                });
            }
        }

        server.on('error', (e) => log.error(e))

        server.on('request', (req, res) => {
            let ssl = false;
            if (req.url === 'http://loadchange.com/getssl') {
                try {
                    let fileString = fs.readFileSync(caCertPath);
                    res.setHeader('Content-Type', 'application/x-x509-ca-cert')
                    res.end(fileString.toString());
                } catch (e) {
                    console.log(e);
                    res.end('please create certificate first!!')
                }
                return
            }
            requestHandler(req, res, ssl);
        });

        server.on('connect', (req, cltSocket, head) => connectHandler(req, cltSocket, head))

        server.on('upgrade', (req, socket, head) => {
            let ssl = false
            upgradeHandler(req, socket, head, ssl)
        })
    })

    return httpServer
}

process.on('uncaughtException', (err) => {
    log.error('uncaughtException: ' + err.message)
})

module.exports = cnproxy
