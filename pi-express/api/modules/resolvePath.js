const fs = require('fs/promises');
const path = require('path');

const libraryPath = (process.env.NODE_ENV === 'development') ? path.resolve('film-files') : require('./filmLibraryPath.json');

class resolvePath {
  static library() {
    return libraryPath;
  } 

  static absolute(relPath) {
    let absPath = path.join(libraryPath, relPath);
    if (absPath.slice(-1) === '/') absPath = absPath.slice(0, -1);
    
    if (absPath === libraryPath || absPath.substring(0, libraryPath.length) !== libraryPath) {
      throw new Error(`Invalid path: ${relPath}`); 
    }
    return absPath;
  }

  static async exists(relPath, isDir = false) {
    const fullPath = resolvePath.absolute(relPath);

    try {
      if (isDir) {
        const stat = await fs.stat(fullPath);
        if (!stat.isDirectory()) throw new Error();
      }
      else await fs.access(fullPath);
      return fullPath;
    }
    catch {
      throw new Error(`'${relPath}' ${(isDir ? 'is not a directory' : 'does not exist')} or cannot be accessed.`);
    }
  }

  static async list(baseDir, relDir = '/') {
    const dirents = await fs.readdir(path.join(libraryPath, baseDir, relDir), { withFileTypes: true });
    const files = await Promise.all(dirents.flatMap(dirent => {
      if (dirent.name === ".DS_Store" || dirent.name === ".actors") return [];
      const newPath = path.join(relDir, dirent.name);
      
      // Special case - want only directories (films) from top level
      if (baseDir === '' || baseDir === '/') return dirent.isDirectory() ? [newPath] : [];
      return dirent.isDirectory() ? [newPath, resolvePath.list(baseDir, newPath)] : [newPath];
    }));
    return Array.prototype.concat(...files);
  }
}

module.exports = resolvePath;