#! /usr/local/bin/node

function format(code) {
    return code
        .replace(/[ \t\v\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]+/g, ' ') // unusual spaces
        .replace(/#.*/g, '') // comments
        .replace(/\r\n|\r|\n/g, '') // line endings
        .replace(/ *= */g, '='); // no spaces around equals
}

function encode(code) {
    return code
        .replace(/(?<!@.*)[-!$%&*_+/]/g, match => ({
            '$': '$0',
            '!': '$1',
            '%': '$2',
            '&': '$3',
            '*': '$4',
            '-': '$5',
            '_': '$6',
            '+': '$7',
            '/': '$8',
        }[match])) // illegal characters
        .replace(/(?<!\$)(?<!@.*)\d/g, '_$&') // illegal digits
        .replace(/(?<!@.*)\[/g, '(\\_.(') // lazy opening
        .replace(/(?<!@.*)]/g, ') _)'); // lazy closing
}

function parse(code) {
    return code.replace(/\ ([$\w]+)/g, '($1)')
        .replace(/ /g, '')
        .replace(/\\([$\w]+)\./g, '$1 => ');
}

function namespace(code) {
    return encode(format(code))
        .split(';')
        .filter(v => v.includes('='))
        .map(v => v.split('=')[0])
}

async function compile(code, root) {
    let lines = format(code).split(';');
    return (await Promise.all(lines.map(async line => {
        console.log(line)
        if (line.slice(0, 8) == 'decrypt ') {
            return `import * as _decrypt from "${line.slice(8)}";`
        }
        if (line.slice(0, 7) == 'import ') {
            let fromIdx = line.indexOf(' from ') + 6;
            let from = line.slice(fromIdx);
            let file = from;
            if (from[0] == '/' || from[0] == '.') {
                file = root + '/../' + from;
            }
            let names;
            if (line.includes('*')) {
                let response = await fetch(file);
                let responseText = await response.text();
                names = '{' + namespace(responseText).join(', ') + '}'
            } else {
                names = encode(line.match(/\{.*}/)[0]);
            }
            if(from.match(/\.lambda$/)) {
                from += '?compile=lcc';
            }
            return `import ${names} from "${from}";`;
        }
        let lineCopy = line;
        line = encode(line).trim();
        if (!line) {
            return '';
        } else if (line.includes('=')) {
            let parts = line.split('=');
            return 'export const ' + parts[0] + ' = ' + parse(parts[1]) + ';';
        } else {
            let parts = line.split('@')
            parts[1] = parts[1].replace(/([$\w]+)/g, '_decrypt.$1');
            console.log(line, parts)
            return `document.body.append('${lineCopy}: ' +  ${parts[1]}(${parse(parts[0])}));
            document.body.append(document.createElement('br'));`;
        }
    }))).join('\n');
}

module.exports = { compile };
