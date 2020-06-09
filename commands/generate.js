const chalk = require('chalk');
const fs    = require('fs');
const os    = require('os');

const child = require('child_process');
const path  = require('path');

const cheerio = require('cheerio');

exports.command = 'generate <source> [target]';
exports.desc = 'Create artifact from markdown';
exports.builder = yargs => {
    yargs.options({

    });
};


exports.handler = async argv => {
    let { source, target } = argv;

    if( target === undefined )
    {
        target = path.basename(source) + '.html';
    }

    let css = path.join( __dirname, '..', 'node_modules', 'github-markdown-css', 'github-markdown.css');

    (async () => {
    
        await generate(source, target, css);

    })();

};

async function generate(source, target, css)
{
  console.log(chalk.keyword('blue')(`Transforming ${source} => ${target}`));
  // child.execSync(`pandoc --from=markdown_mmd+yaml_metadata_block+smart --standalone --to=html -V css=${css} --output=Shells.html ${source}`)

  let Parse = require('../lib/markdown');
  let parser = new Parse();

  console.log(chalk.keyword('green')(`Parsing markdown`));
  let html = await parser.parse( source )
  console.log( chalk.gray(`${html.substring(0,500)}\n...`) );

  console.log(chalk.keyword('green')(`Tweaking and rendering final html`));
  let $ = cheerio.load('<!doctype html>' + html);

  $('head').append(
      `<meta content="text/html;charset=utf-8" http-equiv="Content-Type">
       <meta content="utf-8" http-equiv="encoding"></meta>`
  );

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
    </style>
  `;

  $('head').append(localStyle);

  let githubcss = path.join(__dirname, '..', 'node_modules', 'highlight.js', 'styles', 'github.css');

  $('head').append( 
    `<style>
      ${fs.readFileSync(githubcss)}
    </style>`
  );


  $('head').append(
      `<link rel="stylesheet" href="file:///${css}" />`
  );


  let body = $('body').html();

  $('body').remove();
  $.root().append(`<article class="markdown-body"></article>`);
  $('.markdown-body').append(body);

  console.log(chalk.keyword('pink')(`Final result in ${target}`));
 
  let results = $.html();
  console.log( chalk.gray(`${results.substring(0,500)}\n...`) );

  fs.writeFileSync(target, results);

}