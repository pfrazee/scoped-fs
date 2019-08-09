# scoped-fs

An FS wrapper that keeps all access scoped to a specific folder.

```
npm install scoped-fs
```

## Usage

```js
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
 - symlink
 - access
 - exists
 - lstat
 - stat
 - readdir
 - unlink
 - rmdir

#### `var stopwatch = sfs.watch(name, fn)`

Create a [recursive-watch](https://github.com/mafintosh/recursive-watch) instance.

#### `sfs.setFilter(fn)`

Set a filtering function which causes files & folders to be hidden if the function returns false. Attempts to read a filtered file will give a not found error (ENOENT) while attempts to write will give a permissions error (EPERM).