const url = require('url')
const log = require('../../common/log')
const utils = require('../../common/utils')

function respondFromWebFile(filePath, req, res, next) {
    log.debug('respond with web file: ' + filePath)

    let remoteHost = url.parse(filePath).host
    req.headers && (req.headers.host = remoteHost)

    let options = {
        url: filePath,
        method: req.method,
        headers: req.headers
    }

    let respondFromWebSuccess = (err, data, proxyRes) => {
        if (err) {
            throw err
        }
        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        res.write(data)
        res.end()
    }

    if (req.method === 'POST') {
        let body = ''
        req.on('data', (data) => {
            body += data
        })
        req.on('end', () => {
            options['data'] = body
            utils.request(options, respondFromWebSuccess)
        })
    } else {
        utils.request(options, respondFromWebSuccess)
    }
}

module.exports = respondFromWebFile

