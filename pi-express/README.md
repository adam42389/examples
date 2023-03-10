# Pi-Express Server
Node Express server for hosting all apps and APIs of the Raspberry Pi.

https://raspberrypi

## Layout

**/:** Static app selection

**/film:** Film collection viewer

**/music:** Music player

**/manage:** Film library manager

**/api:**  API interface

## API Reference

Basic Usage:

	/api/<class>/<method>	

All parameters must be sent as JSON in a POST request.  All paths are relative to film library.


### file

| Method | Parameters | Description |
| ------- | ----------| ------------ |
| path |  | Get film library path |
| library |  | Get film library file list |
| rename | `{rename: [{from: path (str), to: path (str)}]}` | Rename file and directories |
| delete | `{delete: [path (str)]}` | Delete files and directories |
| language | `{directory: str, language: (3-letter ISO)}` | Save film .language file


### kodi

| Method | Parameters | Description |
| ------- | ----------| ------------ |
| music   | `{ids: [ids]}` | Clear playlist and play music tracks |
| film   |  `{id: id}` | Play a film |
| setVolume   | `{volume: (0-100)}` | Set volume |
| getVolume   |  | Get current volume |
| clean |  | Clean video library |
| scan |  | Scan video library |
| nfo |  | Export individual .nfo files for films |
| viewed |  | Get list of viewed films |
| database | | Regenerate database for film collection viewer|


### subtitle

| Method | Parameters | Description |
| ------- | ----------| ------------ |
| search   | `{imdbid: str, tmdbid: str, filename: str, language: [English, eng, en]}` | Search  for subtitles |
| download   |  `{source: (yify/os), value: str, path: (to save subtitle)}` | Download subtitles |