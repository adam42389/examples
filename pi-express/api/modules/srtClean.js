//  Cleans advertisements from .srt subtitles.
const terms = require('./srtClean.json');

function srtClean(subtitleStr) {
  const invalidErr = new Error('Invalid format.');
  if (typeof subtitleStr !== 'string') throw invalidErr;
  let blocks = subtitleStr.trim().replace(/\r\n/g, '\n').split('\n\n');
  if (blocks.length <= 1) throw invalidErr;
  let validFormat = false;

  blocks = blocks.flatMap((block, index) => {
    let times;
    let textArr = [];

    block.split('\n').forEach(line => {
      line = line.trim();
      if (!line.length || /^\d+$/.test(line)) return;
      if (line.includes(' --> ')) times = line;
      else textArr.push(line);
    });

    if (!times || !textArr.length) return [];
    validFormat = true;

    const [start, end] = times.split(' --> ').map(time => {
      return Date.parse(`01/01/2007 ${time.substring(0, 8)}`);
    });
    if (end - start > 30000) return [];

    const isEndBlock = index <= 1 || index >= blocks.length - 2;

    for (let subLine of textArr) {
      subLine = subLine.toLowerCase();
      if (isEndBlock) {
        for (const adLine of terms.ends) {
          if (subLine.includes(adLine)) return [];
        }
      }

      for (const adLine of terms.all) {
        if (subLine.includes(adLine)) return [];
      }
    }

    return [[times, ...textArr]];
  });

  if (!validFormat) throw invalidErr;

  blocks = blocks.map((block, index) => {
    block.unshift(index + 1);
    block.push('\n');
    return block.join('\n');
  });

  return blocks.join('').trim();
}

module.exports = srtClean;