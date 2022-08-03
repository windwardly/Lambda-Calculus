#! /usr/bin/env node

var http = require('http');
var url = require('url');
var fs = require('fs');
var os = require('os')
var lcc = require('./lcc')

let port = process.argv[2];
http.createServer((req, res) => {
    let realUrl = (req.connection.encrypted ? 'https': 'http') + '://' + req.headers.host + req.url;
    let q = url.parse(realUrl, true);
    let rootpath = process.argv[3];
    let filename = rootpath + q.pathname;
    filename = decodeURIComponent(filename)
    console.log(filename);
    if (!fs.existsSync(filename)) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return res.end('404 Not Found');
    }
    let file = fs.statSync(filename);
    if (file.isFile()) {
        fs.readFile(filename, async function (err, data) {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                return res.end('404 Not Found');
            }
            let contentType;
            let ext = (filename.match(/\.[\w]+$/) ?? ['.txt'])[0];
            switch (ext.toLowerCase()) {
                case '.mjs': contentType = 'text/javascript'; break;
                case '.js': contentType = 'text/javascript'; break;
                case '.css': contentType = 'text/css'; break;
                case '.json': contentType = 'application/json'; break;
                case '.png': contentType = 'image/png'; break;
                case '.jpg': contentType = 'image/jpg'; break;
                case '.wav': contentType = 'audio/wav'; break;
                case '.txt': contentType = 'text/plain'; break;
                case '.lambda': contentType = 'text/plain'; break;
                case '.olk15Message': {
                    let message = '';
                    for (const char of data) {
                        if (char > 31 && char < 128) {
                            message += String.fromCharCode(char);
                        }
                    }
                    data = message;
                }
                default: contentType = 'text/html';
            }
            switch (q.query.compile) {
                case 'lcc': {
                    if (ext != '.lambda') {
                        console.log('400 Bad Request')
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        return res.end('400 Bad Request');
                    }
                    contentType = 'text/javascript';
                    data = await lcc.compile(data.toString(), q.protocol + q.host + q.pathname);
                }
            }
            console.log('extension:', ext)
            console.log('MIME type:', contentType)
            console.log()
            res.writeHead(200, { 'Content-Type': contentType });
            return res.end(data);
        });
    }

    if (file.isDirectory()) {
        fs.readdir(filename, function (err, files) {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                return res.end('404 Not Found');
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('<ul>');
            let rp = 'http://' + os.hostname() + ':' + port + ('/' + q.pathname.split('/').slice(0, -1).join('/')).replace(/\/{2,}/, '/')
            console.log('return path:', rp)
            console.log('host:', os.hostname());
            console.log();
            res.write(`<li><a href=${rp}>..</li>`)
            for (const file of files) {
                let u = (q.pathname + '/' + encodeURIComponent(file)).replace(/\/{2,}/, '/');
                res.write(`<li><a href=${u}>${file}</li>`);
            }
            res.write('</ul>');
            return res.end();
        });
    }
}).listen(port);