const marked = require('marked');

const markdown = `
Here's a simple footnote,[^1] and here's a longer one.[^bignote]

[^1]: This is the first footnote.

[^bignote]: Here's one with multiple paragraphs and code.
    \`my code\`
    Indent paragraphs to include them in the footnote.
    Add as many paragraphs as you like.
`;

const footnotes = [];
const newTokens = [];
const footnoteTest = /^\[\^[^\]]+\]: /;
const footnoteMatch = /^\[\^([^\]]+)\]: ([\s\S]*)$/;
const referenceTest = /\[\^([^\]]+)\](?!\()/g;

// get block tokens
const tokens = marked.lexer(markdown);

// Check footnote
function checkFootnote (token) {
    if (token.type !== 'paragraph' || !footnoteTest.test(token.text)) {
      return;
    }
  
    const match = token.text.match(footnoteMatch);
    const name = match[1].replace(/\W/g, '-');
    let note = match[2];

    footnotes.push({
        name,
        note: `${marked(note)} <a href="#fnref:${name}">↩</a>`
    });

    // remove footnotes from tokens
    token.toDelete = true;

};

function checkReference(token)
{
    if( token.type === 'paragraph' || token.type === 'text' )
    {
        token.text = token.text.replace(referenceTest, (ref, value) => {
            const name = value.replace(/\W/g, '-');
            let code = ref;

            for (let j = 0; j < footnotes.length; j++) {
                if (footnotes[j].name === name) {
                    code = `<sup id="fnref:${name}"><a href="#fn:${name}">${j + 1}</a></sup>`;
                    break;
                }
            }
            return code;
        });

        if( token.type === 'paragraph')
        {
            // Override children
            token.tokens = marked.lexer(token.text)[0].tokens;
        }
    }
}

function visit (tokens, fn)
{
    for( var token of tokens )
    {
        fn( token );
        // Visit children
        if( token.tokens )
        {
            visit( token.tokens, fn)
        }
    }
}

visit( tokens, (token) => { checkFootnote(token); });


// Remove tokens from AST, starting with top-level
let workList = [ tokens ];
do {
    let tokenList = workList.pop();

    for(var i = tokenList.length-1; i >= 0 ; i--){
        if(tokenList[i].toDelete){
            tokenList.splice(i, 1);
        }
        else if( tokenList[i].tokens )
        {
            workList.push( tokenList[i].tokens );
        }
    }

} while( workList.length != 0 )


visit( tokens, (token) => { checkReference(token); });

  
let html = marked.parser(tokens);

if (footnotes.length > 0) 
{
  html += `
  <hr />
  <ol>
    <li>${footnotes.map(f => f.note).join('</li>\n  <li>')}</li>
  </ol>
  `;
}
  

console.log(html);

//   // multiline notes will be considered indented code blocks
//   if (i + 2 < tokens.length && tokens[i + 2].type === 'code' && tokens[i + 2].codeBlockStyle === 'indented') {
//     note += '\n\n' + tokens[i + 2].text;
//     i += 2;
//   }



// let html = marked.parser(newTokens);

