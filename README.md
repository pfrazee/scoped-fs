# scoped-fs

An FS wrapper that keeps all access scoped to a specific folder.

```
npm install scoped-fs
```

## Usage

```
var ScopedFS = require('scoped-fs')

var fs = new ScopedFS('/home/bob')
fs.readFile('/hello.txt', 'utf8', function (err, content) {
  // reads /home/bob/hello.txt
  console.log('world')
})
```

## API

#### `new ScopedFS(basepath)`

Creates a scoped FS instance. All reads and writes will be restricted to `basepath`; any attempts to use `..` to escape will return an error.

#### Wrapped FS methods

 - createReadStream
 - readFile
 - createWriteStream
 - writeFile
 - mkdir
 - access
 - exists
 - lstat
 - stat
 - readdir
 - unlink
 - rmdir