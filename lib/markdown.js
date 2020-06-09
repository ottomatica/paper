const marked = require('marked');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');

class Parse
{


    async parse(file)
    {
        let highlight = function(code, language) {
            const hljs = require('highlight.js');

            hljs.registerLanguage('bash', function(e)
            {    return {
                    keywords: {
                    literal: 'head cut wget ls tar false true EXPORT'
                    }
                }
            });

            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
            return hljs.highlight(validLanguage, code).value;
            // return require('highlight.js').highlightAuto(code).value;
          }          


        let baseRenderer = new marked.Renderer();
        let renderer = {
        //   heading(text, level) {
        //     const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
        
        //     return `
        //             <h${level}>
        //               <a name="${escapedText}" class="anchor" href="#${escapedText}">
        //                 <span class="header-link"></span>
        //               </a>
        //               ${text}
        //             </h${level}>`;
        //   },
          code(code, infostring, escaped)
          {
            if( infostring == 'warning' )
            {
                return `
                <pre class="warning"><code>
                    ${code}
                </code></pre>
                `;
            }
            else {
                return baseRenderer.code(highlight(code,infostring), infostring, true);
            }
          },
        };

        marked.use({ renderer });
    
        // Set options
        marked.setOptions({
            // renderer: renderer,

            pedantic: false,
            gfm: true,
            tables: true,
            breaks: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
        });

        let metadata = {};
        return await marked.parse(fs.readFileSync(file).toString());
    }

}

module.exports = Parse;