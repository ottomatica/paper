const os = require('os');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

let Util  = require('./util');


class Book
{
    constructor(file)
    {
        this.file = file;
    }

    // path to content
    sourcePath(content)
    {
        return path.join( path.dirname(this.file), content );
    }

    targetPath(content)
    {
        return content.replace(".md","") + ".html";
    }

    // Link within chapter
    chapterLink(content)
    {
        return path.basename(content) + ".html";
    }

    // Return first header (h1, h2, etc.) as title
    title(source, n)
    {
        let markdown = fs.readFileSync( source ).toString();
        let tokens = marked.lexer(markdown);
        //console.log(tokens);
        for( let t of tokens )
        {
            if( t.type == "heading" && t.depth == n )
            {
                return t.text;
            }
        }

        throw new Error(`Could not find a <h2> or ## to use as a title in ${source}`);
    }

    // Given a yaml object of chapters, construct a view for an index.
    async indexBookView(indexYml)
    {
        var view = {
            title: indexYml.title,
            author: indexYml.author.name,
            site: indexYml.author.site,
            synposis: indexYml.cover.synposis,
            root_url: indexYml.root_url,
            cover_img: indexYml.cover.img,
            chapters: []
        };

        for( var chapter of indexYml.chapters  )
        {
            let chView = await this._indexChapterView(chapter, indexYml.root_url);
            view.chapters.push( chView );
        }
        return view;
    }

    // Given a yaml object of a chapter, construct a view for an index
    async _indexChapterView(chapter, root_url)
    {
        let view = {name: chapter.name, about: chapter.about, root_url: root_url, content: []}

        console.log( root_url );

        let stub;
        for( var content of chapter.content )
        {
            // Path to a file
            if( typeof(content) == "string" )
            {
                let source = this.sourcePath(content);
                let title = this.title(source, 2);
                let link  = this.targetPath(content);
                let chapterLink = this.chapterLink(content);

                if( !stub )
                {
                    stub = path.dirname(content);
                }

                view.content.push( {title: title, 
                    source: source, chapterLink: chapterLink, link: link, 
                    root_url: root_url, imgRoot: './'
                });
            }
            // Remotely hosted file
            else
            {
                var url = new URL(content.source);
                let filename = content.name || path.basename(url.pathname);

                // Prepare temporary source for remote file and then fetch
                let source = path.join(os.tmpdir(), stub, filename);
                if( !fs.existsSync( path.dirname( source )) ) {fs.mkdirSync( path.dirname( source)); }
                await Util.get(content.source, source);

                let title = this.title(source, 2);
                let link = this.targetPath( stub + "/" + filename)
                let chapterLink = this.chapterLink( filename );

                view.content.push({
                    title: title, source: source, chapterLink: chapterLink, link: link,
                    imgRoot: Util.rawRootPath(content.source), root_url: root_url
                });
            }
        }
        // Set chapter stub, e.g. "02-basics"
        view.stub = stub;
        return view;
    }

}

module.exports = Book;