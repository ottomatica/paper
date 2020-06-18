const marked = require('marked');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const { info } = require('console');

const footnoteMatch  = /^\[\^([^\]]+)\]:([\s\S]*)$/;
const referenceMatch = /\[\^([^\]]+)\](?!\()/g;
const referencePrefix = "marked-fnref";
const footnotePrefix = "marked-fn";
const footnoteTemplate = (ref, text) => {
  return `<span id="${footnotePrefix}:${ref}">${ref}:</span>${text} <a href="#${referencePrefix}:${ref}">↩</a>`;
};
const referenceTemplate = ref => {
  return `<sup class="footnote-ref" id="${referencePrefix}:${ref}"><a href="#${footnotePrefix}:${ref}">[${ref}]</a></sup>`;
};
  
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

          const interpolateReferences = (text) => {
            return text.replace(referenceMatch, (_, ref) => {
              // console.log(`ref matched ${ref}`, text)
              return referenceTemplate(ref);
            });
          }
          const interpolateFootnotes = (text) => {
            return text.replace(footnoteMatch, (_, value, text) => {
              // console.log('matched')
              return footnoteTemplate(value, text);
            });
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
        // footnotes
        // https://github.com/markedjs/marked/issues/1562#issuecomment-643171344
        paragraph(text) {
            let footnotes = interpolateFootnotes(text);
            let references = interpolateReferences(text);
            if( text.match(footnoteMatch) )
            {
              return '<p class="footnote">' +  footnotes + '</p>\n';
            }
            return marked.Renderer.prototype.paragraph.apply(null, [ references ]);
        },
        code(code, infostring, escaped, options)
          {
            options= options || this.options;
            if( infostring == 'warning' )
            {
                return `
                <pre class="warning"><code>
                    ${code}
                </code></pre>
                `;
            }
            else if( infostring === 'aside' )
            {
              return `
              <pre class="aside"><code>
                  ${code}
              </code></pre>
              `;
            }
            else {
              return marked.Renderer.prototype.code.apply(marked, [ code, infostring, escaped, options ]);
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
            smartypants: true,
            xhtml: false
        });

        let metadata = {};
        return await marked.parse(fs.readFileSync(file).toString());
    }

}

module.exports = Parse;