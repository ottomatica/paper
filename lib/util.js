const https = require('https');
const path = require('path');
const fs   = require('fs');

class Util
{
    static async get(url, file) {

        var u = new URL(url);
        let filename = path.basename(u.pathname);
        let repo = path.dirname(u.pathname);

        return new Promise(((resolve, reject) => {
            let filepath = `https://raw.githubusercontent.com${repo}/master/${filename}`;
            https.get(filepath, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Cannot find ${filename}`));
                } else {

                    let stream = fs.createWriteStream(file);

                    stream.on('finish', () => {
                        console.log(`Fetched remote source ${repo}:${filename}`);
                        resolve(file);
                    });
                    res.pipe(stream);
                }
            })
            .on('error', reject);
        }));
    }
}

module.exports = Util;

// // Test
// (
//     async () => {

//         let file = await get('http://github.com/chrisparnin/EngineeringBasics/Shells.md', '/tmp/Shells.md');
//         console.log(file);

//     }
// )()