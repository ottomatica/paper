const fs = require('fs-extra')
const path  = require('path');

const chalk = require('chalk');
const yaml = require('js-yaml');
const cheerio = require('cheerio');
const marked  = require('marked');
let Mustache = require('mustache');

let Parse = require('../lib/markdown');
let Book  = require('../lib/book');

exports.command = 'generate <source> [target]';
exports.desc = 'Create artifact from markdown';
exports.builder = yargs => {
    yargs.options({

    });
};


exports.handler = async argv => {
    let { source, target } = argv;

    // Setup target defaults
    if( target === undefined )
    {
        target = path.basename(source) + '.html';
    }
    let target_dir = path.dirname( target );
    if( fs.existsSync( target ) && fs.lstatSync(target).isDirectory() )
    {
        // our target is a directory, not a file.
        target_dir = target;
    }
    console.log(`target dir: ${target_dir}`);

    // Prepare css dependencies and copy to target directory
    let github_css = path.join( __dirname, '..', 'node_modules', 'github-markdown-css', 'github-markdown.css');
    let highlight_css = path.join(__dirname, '..', 'node_modules', 'highlight.js', 'styles', 'github.css');
    if( !fs.existsSync( target_dir) )
    {
        fs.mkdirSync( target_dir );
    }

    fs.copyFileSync( github_css, path.join( target_dir, 'github-markdown.css') );
    fs.copyFileSync( highlight_css, path.join( target_dir, 'github.css') );

    css = ['github-markdown.css', 'github.css'];

    (async () => {
    
        // check if source is index
        if( source.endsWith(".yml") )
        {
            await book(source, target_dir, css);
        }
        else
        {
            await generate(source, target, css, {});
        }

    })();

};

// Process index file
async function book(file, target_dir, css)
{
    const indexYml = yaml.safeLoad(fs.readFileSync(file), 'utf8');

    let book = new Book(file);
    let view = await book.indexBookView(indexYml);

    console.log(JSON.stringify(view, null, 3));
    var bookIndexTemplate = fs.readFileSync( path.join( __dirname, '..', 'lib', 'templates', 'bookIndex.mustache')).toString();
    var chapterIndexTemplate = fs.readFileSync( path.join( __dirname, '..', 'lib', 'templates', 'chapterIndex.mustache')).toString();
    var sidebarTemplate = fs.readFileSync( path.join( __dirname, '..', 'lib', 'templates', 'sidebar.mustache')).toString();

    await generateView(view, path.join(target_dir, 'index.html'), bookIndexTemplate, css);

    // process chapter content
    for( var chapter of view.chapters )
    {
        // Prepare chapter destination
        if( !fs.existsSync( path.join(target_dir, chapter.stub)) )
        {
            fs.mkdirSync( path.join(target_dir, chapter.stub));
        }
        // Copy any images
        let img_dir = path.join( path.dirname(file), chapter.stub, 'imgs');
        if( fs.existsSync( img_dir) )
        {
            fs.copy( img_dir, path.join(target_dir, chapter.stub, 'imgs'));
        }

        // Create index for chapter content
        await generateView(chapter, path.join(target_dir, chapter.stub, 'index.html'), chapterIndexTemplate, css );

        for( var content of chapter.content )
        {
            let source = content.source;
            let target = path.join( target_dir, content.link);

            options = { imgRoot: content.imgRoot,
                        sidebar: {
                            view: view,
                            template: sidebarTemplate
                        },
                        root_url: view.root_url
            };

            // if( !fs.existsSync( path.dirname(target) ))
            // {
            //     fs.mkdirSync( path.dirname(target));
            // }

            await generate(source, target, css, options )
        }
    }

}




async function generateView(view, target, template, css)
{
    var output = Mustache.render(template, view);
    console.log(output);
    let html = await marked( output );
    console.log(html);
    let results = await renderHtml(html, css, {root_url: view.root_url});

    fs.writeFileSync(target, results);
}

async function renderHtml(html, css, options)
{
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
          .sidebar {padding-top: 15px;}
      }
  
      .markdown-body .warning {
          border-style: solid;
          background-color: rgba(255,10,0,.05);
      }

      .markdown-body .warning {
        border-style: solid;
        border-left-color: #f16529;
      }

      .markdown-body pre
      {
        border-radius: 0.3rem;
        border: solid 1px #dce6f0;
      }

      .main {
        margin-left: 200px; /* Same as the width of the sidenav */
        padding: 0px 10px;
      }

      /* The sidebar menu */
      .sidebar {
        height: 100%; /* Full-height: remove this if you want "auto" height */
        width: 200px; /* Set the width of the sidebar */
        position: fixed; /* Fixed Sidebar (stay in place on scroll) */
        z-index: 1; /* Stay on top */
        top: 0; /* Stay at the top */
        left: 0;
        background-color: #F2E9E4; 
        overflow-x: hidden; /* Disable horizontal scroll */
        padding-top: 20px;
        padding-left: 10px;
        color: #261C16;
        border: 1px solid #D9D0C7;
      }

      /* The navigation menu links */
      .sidebar a {
        color: #261C16;
        display: block;
      }

      /* When you mouse over the navigation links, change their color */
      .sidebar a:hover {
        color: #8C8480;
      }

      .markdown-body .footnote-ref {
          padding-left:1px;
      }

      .markdown-body .footnote-ref a {
        color: #261C16;
        text-decoration: none;
      }

      </style>
    `;
  
    $('head').append(localStyle);
  
    for( var link of css)
    {
        let url = `${options.root_url}${link}`;
        $('head').append(
            `<link rel="stylesheet" href="${url}" />`
        );
    }


    if( options.imgRoot && options.imgRoot != './')
    {
        // Rewrite remote imgs to be use remote imgRoot.
        $('img').each( function() {
            var link = $(this).attr('src');
            if (!link.startsWith('http') && !link.startsWith('//'))
            {
                let fixedUrl = options.imgRoot + link;
                $(this).attr('src', fixedUrl);
            }
        });
    }

  
    let body = $('body').html();
    $('body').remove();

    if( options.sidebar )
    {
        // console.log(JSON.stringify( options.sidebar ));
        var output = Mustache.render(options.sidebar.template, options.sidebar.view);
        console.log(output);
        let sidebar = await marked( output );
    
        $.root().append(
            `<div class="sidebar">
            ${sidebar}
            </div>`
        );
    }

    $.root().append(`<div class="main"><article class="markdown-body"></article></div>`);
    $('.markdown-body').append(body);

    return $.html();
}

async function generate(source, target, css, options)
{
  console.log(chalk.keyword('blue')(`Transforming ${source} => ${target}`));
  // child.execSync(`pandoc --from=markdown_mmd+yaml_metadata_block+smart --standalone --to=html -V css=${css} --output=Shells.html ${source}`)

  let parser = new Parse();

  console.log(chalk.keyword('green')(`Parsing markdown`));
  let html = await parser.parse( source )
  console.log( chalk.gray(`${html.substring(0,500)}\n...`) );

  console.log(chalk.keyword('green')(`Tweaking and rendering final html`));
  let results = await renderHtml(html, css, options);

  console.log(chalk.keyword('pink')(`Final result in ${target}`));
 
  console.log( chalk.gray(`${results.substring(0,500)}\n...`) );

  fs.writeFileSync(target, results);

}