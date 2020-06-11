const https = require('https');
const path = require('path');
const fs   = require('fs');

class Util
{

    static rawSource(url) {
        // https://raw.githubusercontent.com/CSC-DevOps/profile/master/img/profile.png
        var u = new URL(url);
        let filename = path.basename(u.pathname);
        let repo = path.dirname(u.pathname);

        let filepath = `https://raw.githubusercontent.com${repo}/master/${filename}`;
        return filepath;
    }

    static rawRootPath(url) {
        // https://raw.githubusercontent.com/CSC-DevOps/profile/master/img/profile.png
        var u = new URL(url);
        let filename = path.basename(u.pathname);
        let repo = path.dirname(u.pathname);

        let filepath = `https://raw.githubusercontent.com${repo}/master/`;
        return filepath;
    }


    static async get(url, file) {
        return new Promise(((resolve, reject) => {
            let filepath = this.rawSource(url);
            https.get(filepath, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Cannot find ${filename}`));
                } else {

                    let stream = fs.createWriteStream(file);

                    stream.on('finish', () => {
                        console.log(`Fetched remote source from ${url}`);
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