const path = require('path')
const fs = require('fs')
const watch = require('recursive-watch')

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/

class ScopedFS {
  constructor (basepath) {
    this.base = basepath
    this._filterFn = false
  }

  setFilter (fn) {
    this._filterFn = fn || false
  }

  _filter (filepath) {
    if (!this._filterFn) return true
    return this._filterFn(unjoin(this.base, filepath))
  }

  createReadStream (name, opts) {
    name = join(this.base, name)
    if (!name) throw new Error('Invalid path')
    if (!this._filter(name)) throw createNotFoundError()
    return fs.createReadStream(name, opts)
  }

  readFile (name, ...args) {
    name = join(this.base, name)
    var cb = args[args.length - 1]
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createNotFoundError())
    return fs.readFile(name, ...args)
  }

  readFileSync (name, ...args) {
    name = join(this.base, name)
    if (!name) throw new Error('Invalid path')
    if (!this._filter(name)) throw createNotFoundError()
    return fs.readFileSync(name, ...args)
  }

  createWriteStream (name, opts) {
    name = join(this.base, name)
    if (!name) throw new Error('Invalid path')
    if (!this._filter(name)) throw createPermError()
    return fs.createWriteStream(name, opts)
  }

  writeFile (name, ...args) {
    name = join(this.base, name)
    var cb = args[args.length - 1]
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createPermError())
    return fs.writeFile(name, ...args)
  }

  writeFileSync (name, ...args) {
    name = join(this.base, name)
    if (!name) throw new Error('Invalid path')
    if (!this._filter(name)) throw createPermError()
    return fs.writeFileSync(name, ...args)
  }

  mkdir (name, ...args) {
    name = join(this.base, name)
    var cb = args[args.length - 1]
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createPermError())
    return fs.mkdir(name, ...args)
  }

  symlink (name, ...args) {
    name = join(this.base, name)
    var cb = args[args.length - 1]
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createPermError())
    return fs.symlink(name, ...args)
  }

  access (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createNotFoundError())
    return fs.access(name, cb)
  }

  exists (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(false)
    return fs.exists(name, cb)
  }

  lstat (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createNotFoundError())
    return fs.lstat(name, cb)
  }

  stat (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createNotFoundError())
    return fs.stat(name, cb)
  }

  readdir (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createNotFoundError())
    return fs.readdir(name, (err, childNames) => {
      if (err) return cb(err)
      childNames = childNames.filter(childName => this._filter(path.join(name, childName)))
      cb(null, childNames)
    })
  }

  unlink (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createNotFoundError())
    return fs.unlink(name, cb)
  }

  rmdir (name, cb) {
    name = join(this.base, name)
    if (!name) return cb(new Error('Invalid path'))
    if (!this._filter(name)) return cb(createNotFoundError())
    return fs.rmdir(name, cb)
  }

  watch (name, fn) {
    name = join(this.base, name)
    if (!name) throw new Error('Invalid path')
    if (!this._filter(name)) throw createNotFoundError()
    return watch(name, changedPath => {
      if (!this._filter(changedPath)) return
      changedPath = unjoin(this.base, changedPath)
      fn(changedPath)
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
  return (subpath.charAt(0) === path.sep) ? subpath : (path.sep + subpath)
}

function createNotFoundError () {
  var err = new Error('File not found')
  err.code = 'ENOENT'
  err.notFound = true
  err.causedByFiltering = true
  return err
}

function createPermError () {
  var err = new Error('Not allowed')
  err.code = 'EPERM'
  err.notAllowed = true
  err.causedByFiltering = true
  return err
}
