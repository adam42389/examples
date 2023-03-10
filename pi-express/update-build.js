#!/usr/bin/env node
/* 
  Copies react build files from a project into the express static (public) folder.

  Usage:
    ./update-build.js <destination directory name>
    ie. ./update-build.js film

    Can be added to react build command in package.json:
    
    "scripts": {
        "build": "react-scripts build; ../pi-express/update-build.js <destination directory name>",
    },

  ** Note: Must be run from base directory of the react project **
*/
const fs = require('fs');
const path = require('path');

const ignore = ['.DS_Store', 'posters', 'data.json'];
const buildSource = path.join(process.env.PWD,'build');
if (!fs.existsSync(buildSource)) return console.error('Script is not running from the base directory of a react project.');

const destName = process.argv[2];
if (!destName) return console.error('Missing build destination directory name.');

const buildDest =  path.join(path.dirname(process.argv[1]), 'public', destName);
if (!fs.existsSync(buildDest)) return console.error('Invalid build destination directory name.');

console.log('Copying build files to pi-express...');

for (const item of fs.readdirSync(buildDest)) {
  if (ignore.includes(item)) continue;
  fs.rmSync(path.join(buildDest, item), {recursive: true});
}

for (const item of fs.readdirSync(buildSource)) {
  if (ignore.includes(item)) continue;
  fs.cpSync(path.join(buildSource, item), path.join(buildDest, item), {recursive: true});
}

console.log('Copying done.');