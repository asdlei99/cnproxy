'use strict';

var url = require('url');
var log = require('../../common/log');
var utils = require('../../common/utils');

function respondFromWebFile(filePath, req, res, next) {
    log.debug('respond with web file: ' + filePath);

    var remoteHost = url.parse(filePath).host;
    req.headers && (req.headers.host = remoteHost);

    var options = {
        url: filePath,
        method: req.method,
        headers: req.headers
    };

    var respondFromWebSuccess = function respondFromWebSuccess(err, data, proxyRes) {
        if (err) {
            throw err;
        }
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.write(data);
        res.end();
    };

    if (req.method === 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            options['data'] = body;
            utils.request(options, respondFromWebSuccess);
        });
    } else {
        utils.request(options, respondFromWebSuccess);
    }
}

module.exports = respondFromWebFile;