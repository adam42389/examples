import path from 'path-browserify';
import Film from './file.js';
import piQuery from '../piQuery.js';
import getLanguage from './language.js';
import Subtitle from './Subtitle.js';

const defaultLang = ['English', 'eng', 'en'];

class Library {
  constructor(updateStatus) {
    this.updateStatus = updateStatus;

    this.tasks = [];
    this.issues = [];
    this.needCleanScan = false;

    this.renameDir = [];
    this.renameFile = [];
    this.delete = [];
    this.save = [];
    this.download = [];
  }

  async analyse() {
    this.updateStatus('Fetching filesystem details...');
    const filmDirectories = await piQuery('file/library');

    this.updateStatus('Analysing filesystem...');
    for (const filmDirectory of filmDirectories) {
      try {
        const filmFiles = new Film(filmDirectory);  
        filmFiles.validate();
        await this.analyseFilm(filmFiles);
      }
      catch(err) {
        if (err.name === 'FilmIssue') this.issues.push(`'${filmDirectory.dir}' ${err.message}`);
        else throw err;
      }
    }
  }

  async analyseFilm(filmFiles) {
    const tasks = {
      renameDir: [],
      renameFile: [],
      delete: [],
      save: [],
      download: [],
    }

    if (filmFiles.origDir !== filmFiles.newDir) tasks.renameDir.push({from: filmFiles.origDir, to: filmFiles.newDir});
    
    filmFiles.other.forEach(file => {
      tasks.delete.push([filmFiles.newDir, file]);
    });

    ['poster', 'thumb', 'fanart'].forEach(suffix => {
      const artPath = `/${filmFiles.fileTitle}-${suffix}.jpg`;
      if (filmFiles[suffix] && filmFiles[suffix] !== artPath) tasks.renameFile.push([filmFiles.newDir, {from: filmFiles[suffix], to: artPath}]);
    });

    filmFiles.videos.forEach(video => {
      if (video.origPath !== video.newPath) {
        tasks.renameFile.push([filmFiles.newDir, {from: video.origPath, to: video.newPath}]);
        this.needCleanScan = true;
      }
    });

    if (!filmFiles.languages.length) {
      try {
        filmFiles.languages = await getLanguage(filmFiles.imdbid, filmFiles.tmdbid); 
      }
      catch {}

      if (!filmFiles.languages.length) filmFiles.languages.push(defaultLang);
      tasks.save.push({directory: filmFiles.newDir, languages: filmFiles.languages});
    }

    const userLang = JSON.parse(localStorage.getItem('language')) || defaultLang;
    let wantSubs = false;

    if (filmFiles.languages.length > 1) wantSubs = true;
    else if (filmFiles.languages[0][0] !== userLang[0]) wantSubs = true;
    
    filmFiles.subtitles.forEach(subtitle => {
      if (subtitle.newPath) {
        if (subtitle.language[0] === userLang[0]) wantSubs = false;
        if (subtitle.origPath !== subtitle.newPath) tasks.renameFile.push([filmFiles.newDir, {from: subtitle.origPath, to: subtitle.newPath}]);
      }  
      else tasks.delete.push([filmFiles.newDir, subtitle.origPath]);
    });

    if (wantSubs) {
      const videoPath = path.join(filmFiles.origDir, filmFiles.videos[0].origPath);
      const searchResult = await Subtitle.search(userLang, filmFiles.imdbid, filmFiles.tmdbid, videoPath);

      if (searchResult.source) {
        let savePath = filmFiles.videos[0].newPath.replace(filmFiles.videos[0].ext, `.${userLang[0]}.srt`);
        savePath = path.join(filmFiles.newDir, savePath);
        tasks.download.push({savePath, searchResult, language: userLang, title: filmFiles.fileTitle});
      }
    }

    Object.keys(tasks).forEach(action => {
      this[action] = this[action].concat(tasks[action]);
      tasks[action].forEach(task => {
        let info;
        let taskAction = action;
  
        switch (action) {
          case 'renameDir':
            info = `'${task.from}' -> '${task.to}'`;
            taskAction = 'rename';
            break;

          case 'renameFile':
            info = `'${filmFiles.origDir}${task[1].from}' -> '${filmFiles.newDir}${task[1].to}'`;
            taskAction = 'rename';
            break;
          
          case 'delete':
            info = `'${filmFiles.origDir}${task[1]}'`;
            break; 
            
          case 'save':
            const langArr = filmFiles.languages.map(codes => {return codes[0]});
          
            info = `Language${langArr.length > 1 ? 's' : ''} of '${filmFiles.fileTitle}': ${langArr.join(', ')}`;
            break;
  
          case 'download':
            info = `${task.language[0]} subtitles for '${filmFiles.fileTitle}'`;
            break;
 
          default:
        }

        this.tasks.push({action: taskAction, info});
      });
    });
  }
   
  async perform() {
    if (this.renameDir.length) {
      this.updateStatus('Renaming film directories...');
      await piQuery('file/rename', {rename: this.renameDir});
    }

    if (this.renameFile.length) {
      this.updateStatus('Renaming files...');
      await piQuery('file/rename', {rename: this.renameFile.map(task => {return {from: task[0]+task[1].from, to: task[0]+task[1].to}})});
    }

    if (this.delete.length) {
      this.updateStatus('Deleting unneeded files and directories...');
      await piQuery('file/delete', {delete: this.delete.map(task => {return task[0]+task[1]})});
    }

    if (this.save.length) {
      this.updateStatus('Saving film languages...');
      for (const task of this.save) await piQuery('file/language', task);
    }

    if (this.download.length) {
      for (const task of this.download) {
        this.updateStatus(`Downloading ${task.language[0]} subtitles for '${task.title}'...`);
        await Subtitle.download(task.savePath, task.searchResult);
      }
    }
  }
}

export default Library;