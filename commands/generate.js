const chalk = require('chalk');
const fs    = require('fs');
const os    = require('os');

const child = require('child_process');
const path  = require('path');

const cheerio = require('cheerio');

exports.command = 'generate <source>';
exports.desc = 'Create artifact from markdown';
exports.builder = yargs => {
    yargs.options({

    });
};


exports.handler = async argv => {
    const { source } = argv;

    let css = path.join( __dirname, '..', 'node_modules', 'github-markdown-css', 'github-markdown.css');

    (async () => {
    
        await generate(source, css);

    })();

};

async function generate(source, css)
{
    console.log(chalk.keyword('pink')(`Transforming ${source}`));
    // child.execSync(`pandoc --from=markdown_mmd+yaml_metadata_block+smart --standalone --to=html -V css=${css} --output=Shells.html ${source}`)

    let Parse = require('../lib/markdown');
    let parser = new Parse();

    let html = await parser.parse( source )

    // console.log( html );

    console.log(chalk.keyword('pink')(`Adding css`));
    let $ = cheerio.load(html);

    let localStyle = `<style>
    .markdown-body {
		box-sizing: border-box;
		min-width: 200px;
		max-width: 980px;
		margin: 0 auto;
        padding: 45px;
        border-style: dotted solid;
    }

	@media (max-width: 767px) {
		.markdown-body {
			padding: 15px;
        }
    }

    .markdown-body .warning {
        border-style: solid;
        background-color: rgba(255,10,0,.05);
    }

    .hljs {
        display: block;
        overflow-x: auto;
        padding: 0.5em;
        color: #333;
        background: #f8f8f8;
      }
      
      .hljs-comment,
      .hljs-quote {
        color: #998;
        font-style: italic;
      }
      
      .hljs-keyword,
      .hljs-selector-tag,
      .hljs-subst {
        color: #333;
        font-weight: bold;
      }
      
      .hljs-number,
      .hljs-literal,
      .hljs-variable,
      .hljs-template-variable,
      .hljs-tag .hljs-attr {
        color: #008080;
      }
      
      .hljs-string,
      .hljs-doctag {
        color: #d14;
      }
      
      .hljs-title,
      .hljs-section,
      .hljs-selector-id {
        color: #900;
        font-weight: bold;
      }
      
      .hljs-subst {
        font-weight: normal;
      }
      
      .hljs-type,
      .hljs-class .hljs-title {
        color: #458;
        font-weight: bold;
      }
      
      .hljs-tag,
      .hljs-name,
      .hljs-attribute {
        color: #000080;
        font-weight: normal;
      }
      
      .hljs-regexp,
      .hljs-link {
        color: #009926;
      }
      
      .hljs-symbol,
      .hljs-bullet {
        color: #990073;
      }
      
      .hljs-built_in,
      .hljs-builtin-name {
        color: #0086b3;
      }
      
      .hljs-meta {
        color: #999;
        font-weight: bold;
      }
      
      .hljs-deletion {
        background: #fdd;
      }
      
      .hljs-addition {
        background: #dfd;
      }
      
      .hljs-emphasis {
        font-style: italic;
      }
      
      .hljs-strong {
        font-weight: bold;
      }
	`;

    $('head').append(localStyle);

    $('head').append(
        `<link rel="stylesheet" href="${css}" />`
    );


    let body = $('body').html();

    $('body').remove();
    $.root().append(`<article class="markdown-body"></article>`);
    $('.markdown-body').append(body);

    fs.writeFileSync('Shells2.html', $.html())

}