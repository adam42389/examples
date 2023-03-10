import path from 'path-browserify';
import languages from '../languages.json';

const artSuffix = ['-fanart.jpg', '-poster.jpg', '-thumb.jpg'];
const defaultLang = ['English','eng','en'];

class Film {
  constructor(details) {
    this.title = details.title;
    this.year = details.year;
    this.fileTitle = this.clean(`${details.title} (${details.year})`);

    this.languages = details.languages;
    this.imdbid = details.imdbid;
    this.tmdbid = details.tmdbid;

    this.origDir = details.dir;
    this.newDir = `/${this.fileTitle}`;
    
    this.nfo = details.files.nfo;
    
    this.poster = null;
    this.thumb = null;
    this.fanart = null;
    this.image = null;

    this.videos = [];
    this.subtitles = [];
    this.other = details.files.other;

    this.files = details.files;
  }

  validate() {
    if (!this.files.video.length) throw new FilmIssue("doesn't contain a video file.");
    if (!this.nfo) throw new FilmIssue("doesn't contain a valid .nfo file.");

    for (const jpg of this.files.jpg) {
      let match = false;
      for (const suffix of artSuffix) {
        if (jpg.slice(-suffix.length) === suffix) {
          this[suffix.slice(1, -4)] = jpg;
          match = true;
          break;
        }
      }

      if (jpg === `/${this.fileTitle}.jpg`) {
        this.image = jpg;
        match = true;
      }

      if (!match) this.other.push(jpg);
    }

    const checkPart = this.files.video.length > 1 ? true : false;
    let tally = {parts: 0, check: 0};
    
    this.files.video.forEach((fileName, index) => {
      const video = new File(fileName, this.fileTitle, checkPart);
      this.videos.push(video);

      tally.parts += video.part;
      tally.check += index + 1;
    });

    if (checkPart) {
      if (tally.parts !== tally.check) throw new FilmIssue("contains multiple video files.");       
     
      this.videos.sort((a, b) => {
        return a.part < b.part ? -1 : 1;
      });
    }
   
    this.files.sub.forEach(fileName => {
      this.subtitles.push(new Subtitle(fileName, this.fileTitle, checkPart));
    });  

    this.videos.forEach((video, videoIndex) => {
      const videoSubs = {};
      
      this.subtitles.forEach((subtitle, subIndex) => {
        if (subtitle.ext === '.idx' || subtitle.newPath || subtitle.part !== video.part) return;
        const langCode3 = subtitle.language[1];
        if (!videoSubs[langCode3] || videoSubs[langCode3][0] < subtitle.ranking) videoSubs[langCode3] = [subtitle.ranking, subIndex];
      });
      
      if (checkPart && videoIndex === 0) {
        this.subtitles.forEach((subtitle, subIndex) => {
          if (subtitle.ext === '.idx' || subtitle.part) return;
          const langCode3 = subtitle.language[1];
          if (!videoSubs[langCode3] || videoSubs[langCode3][0] < subtitle.ranking) videoSubs[langCode3] = [subtitle.ranking, subIndex];
        });
      }
 
      for (const ref of Object.values(videoSubs)) {
        this.subtitles[ref[1]].setVideo(video);
      }
    });

    this.subtitles.forEach(subIdx => {
      if (subIdx.ext !== '.idx') return;
      const ixdBase = path.basename(subIdx.origPath, subIdx.ext);

      for (const subPair of this.subtitles) {
        if (subPair.ext !== '.sub') continue;
        if (ixdBase === path.basename(subPair.origPath, subPair.ext) && subPair.newPath) {
          subIdx.newPath = `${subPair.newPath.slice(0, -4)}.idx`;
          subIdx.newPart = subPair.part;
          break;
        }
      }
    });
  }

  clean(fileName) {
    return fileName.normalize("NFD").replace(/\?|:|[\u0300-\u036f]/g, "").replace(/\/|\*/g, " ");
  }
}

class File {
  constructor(filePath, fileTitle, checkPart) {    ;
    this.fileTitle = fileTitle;
    this.origPath = filePath;
    this.ext = path.extname(filePath);
    this.part = checkPart ? this.checkPart() : 0;
    this.newPath = `/${fileTitle}${this.part ? ` part${this.part}`: ''}${this.ext}`;
  }

  checkPart() {
    const baseName = path.basename(this.origPath, this.ext).trim();
    const partName = baseName.match(/\Dpart\s?\d/gi);
    if (!partName) return 0;
    return parseInt(partName[0].match(/\d/g)) || 0;
  }
}

class Subtitle extends File {
  constructor(...params) {
    super(...params);
    this.newPath = null;
    this.language = null;
    this.ranking = 0;
    this.checkLanguage();
    this.forced = path.basename(this.origPath, this.ext).toLowerCase().slice(-6) === 'forced'

    if (this.ext === '.srt') this.ranking += 4;
  }

  checkLanguage() {  
    let fileName = path.basename(this.origPath, this.ext).trim().toLowerCase();
    fileName = fileName.replace(`${this.fileTitle}`.toLowerCase(), '');
    if (!fileName.length) return this.language = defaultLang;
   
    for (const codes of languages) {
      if (fileName.slice(-codes[0].length) ===  codes[0].toLowerCase()) {
        this.ranking = 3;
        return this.language = codes;
      } 

      if (fileName.slice(-codes[1].length) ===  codes[1] && this.ranking < 2) {
        this.ranking = 2;
        this.language = codes;
      }
 
      if (fileName.slice(-codes[2].length) ===  codes[2] && !this.ranking) {
        this.ranking = 1;
        this.language = codes;
      }      
    }
    
    if (!this.ranking) this.language = defaultLang;
  }
  
  setVideo(video) {
    this.part = video.part;
    this.newPath = `/${this.fileTitle}${this.part ? ` part${this.part}`: ''}.${this.language[0]}${this.forced ? '.Forced' : ''}${this.ext}`;
  }
}

function FilmIssue(message) {
  const err = new Error(message);
  err.name ='FilmIssue';
  return err;
}

export default Film;