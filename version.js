const Version = require("node-version-assets");


const version = new Version({
    assets: [
        'build/index.js'
    ],
    grepFiles: ['build/index.html']
});

version.run();
