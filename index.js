const path = require('path')
const fs = require('fs')
const watch = require('recursive-watch')

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/

class ScopedFS {
  constructor (basepath) {
    this.base = basepath
  }

  createReadStream (name, opts) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.createReadStream(name, opts)
  }

  readFile (name, ...args) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.readFile(name, ...args)
  }

  createWriteStream (name, opts) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.createWriteStream(name, opts)
  }

  writeFile (name, ...args) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.writeFile(name, ...args)
  }

  mkdir (name, ...args) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.mkdir(name, ...args)
  }

  access (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.access(name, cb)
  }

  exists (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.exists(name, cb)
  }

  lstat (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.lstat(name, cb)
  }

  stat (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.stat(name, cb)
  }

  readdir (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.readdir(name, cb)
  }

  unlink (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.unlink(name, cb)
  }

  rmdir (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    return fs.rmdir(name, cb)
  }

  watch (name, fn) {
    name = join(this.base, name)
    return watch(name, changedPath => {
      fn(unjoin(this.base, changedPath))
    })
  }
}
module.exports = ScopedFS

function join (rootpath, subpath) {
  // make sure they're not using '..' to get outside of rootpath
  if (UP_PATH_REGEXP.test(path.normalize('.' + path.sep + subpath))) {
    return false
  }
  return path.normalize(path.join(rootpath, subpath))
}

function unjoin (rootpath, subpath) {
  subpath = subpath.slice(rootpath.length)
  return (subpath.charAt(0) === '/') ? subpath : ('/' + subpath)
}
