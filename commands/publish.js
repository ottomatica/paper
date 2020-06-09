
const path  = require('path');
const ghpages = require('gh-pages');

exports.command = 'publish <source_dir> <target_repo>';
exports.desc = 'Publish directory to remote target gh-pages branch';
exports.builder = yargs => {
    yargs.options({

    });
};


exports.handler = async argv => {
    let { source_dir, target_repo } = argv;

    (async () => {
    
        await publish(source_dir, target_repo);

    })();

};

async function publish(source_dir, target_repo)
{
 
    ghpages.publish(source_dir, {repo:target_repo}, function(err) {

        if( err ) {console.log(err); }

    });

}

