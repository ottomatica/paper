const fs = require('fs');
const path = require('path');
const marked = require('marked');

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
        return content + ".html";
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
    indexBookView(indexYml)
    {
        var view = {
            title: indexYml.title,
            author: indexYml.author,
            chapters: []
        };

        for( var chapter of indexYml.chapters  )
        {
            let chView = this._indexChapterView(chapter);
            view.chapters.push( chView );
        }
        return view;
    }

    // Given a yaml object of a chapter, construct a view for an index
    _indexChapterView(chapter)
    {
        let view = {name: chapter.name, about: chapter.about, content: []}

        for( var content of chapter.content )
        {
            // Path to a file
            if( typeof(content) == "string" )
            {
                let source = this.sourcePath(content);
                let title = this.title(source, 2);
                let link  = this.targetPath(source);

                view.content.push( {title: title, link: link} );
            }
            // Remotely hosted file
        }
        return view;
    }

}

module.exports = Book;