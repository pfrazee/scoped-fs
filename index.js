const path = require('path')
const fs = require('fs')
const watch = require('recursive-watch')

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/

const ASYNC_METHODS = ['access', 'appendFile', 'chmod', 'chown', 'exists',
                       'lchmod', 'lchown', 'lstat', 'mkdir', 'mkdtemp', 'open',
                       'readdir', 'readFile', 'rmdir', 'stat', 'truncate',
                       'unlink', 'utimes', 'writeFile']
const SYNC_METHODS = ['accessSync', 'appendFileSync', 'chmodSync', 'chownSync',
                      'createReadStream', 'createWriteStream', 'existsSync',
                      'lchmodSync', 'lchownSync', 'lstatSync', 'mkdirSync',
                      'mkdtempSync', 'openSync', 'readdirSync', 'readFileSync',
                      'rmdirSync', 'statSync', 'truncateSync', 'unlinkSync',
                      'unwatchFile', 'utimesSync', 'watchFile', 'writeFileSync']
const FD_METHODS = ['close', 'closeSync', 'fchmod', 'fchmodSync', 'fchown',
                    'fchownSync', 'fdatasync', 'fdatasyncSync', 'fstat',
                    'fstatSync', 'fsync', 'fsyncSync', 'ftruncate',
                    'ftruncateSync', 'futimes', 'futimesSync', 'read',
                    'readSync', 'write', 'writeSync']
const BINARY_ASYNC_METHODS = ['link', 'rename', 'symlink']
const BINARY_SYNC_METHODS = ['linkSync', 'renameSync', 'symlinkSync']
const UNARY_ASYNC_METHODS = ['readlink', 'realpath']
const UNARY_SYNC_METHODS = ['readlinkSync', 'realpathSync']


class ScopedFS {
  constructor (basepath) {
    this.base = basepath
  }

  watch (name, fn) {
    name = join(this.base, name)
    return watch(name, changedPath => {
      fn(unjoin(this.base, changedPath))
    })
  }
}

ASYNC_METHODS.forEach(function(name)
{
  const func = fs[name]
  if(!func) return

  ScopedFS.prototype[name] = function(path, ...args)
  {
    if(typeof path === 'string')
    {
      path = join(this.base, path)
      if(!path) return args[args.length-1](new Error('Invalid path'))
    }

    return func(path, ...args)
  }
})

SYNC_METHODS.forEach(function(name)
{
  const func = fs[name]
  if(!func) return

  ScopedFS.prototype[name] = function(path, ...args)
  {
    if(typeof path === 'string')
    {
      path = join(this.base, path)
      if(!path) throw new Error('Invalid path')
    }

    return func(path, ...args)
  }
})

FD_METHODS.forEach(function(name)
{
  const func = fs[name]
  if(!func) return

  ScopedFS.prototype[name] = func
})

BINARY_ASYNC_METHODS.forEach(function(name)
{
  const func = fs[name]
  if(!func) return

  ScopedFS.prototype[name] = function(oldPath, newPath, ...args)
  {
    const cb = args[args.length-1]

    const target = join(this.base, oldPath)
    if(!target) return cb(new Error('Invalid path'))

    newPath = join(this.base, newPath)
    if(!newPath) return cb(new Error('Invalid path'))

    if(name !== 'symlink' || path.isAbsolute(oldPath)) oldPath = target

    return func(oldPath, newPath, ...args)
  }
})

BINARY_SYNC_METHODS.forEach(function(name)
{
  const func = fs[name]
  if(!func) return

  ScopedFS.prototype[name] = function(oldPath, newPath, ...args)
  {
    const target = join(this.base, oldPath)
    if(!target) throw new Error('Invalid path')

    newPath = join(this.base, newPath)
    if(!newPath) throw new Error('Invalid path')

    if(name !== 'symlinkSync' || path.isAbsolute(target)) oldPath = target

    return func(oldPath, newPath, ...args)
  }
})

UNARY_ASYNC_METHODS.forEach(function(name)
{
  const func = fs[name]
  if(!func) return

  ScopedFS.prototype[name] = function(src, ...args)
  {
    const base = this.base
    src = join(base, src)
    if(!src) throw new Error('Invalid path')

    const cb = args.pop()

    return func(src, ...args, function(err, target)
    {
      if(err) return cb(err)

      if(path.isAbsolute(target))
      {
        if(!target.startsWith(base)) return cb(new Error('Invalid target path'))

        target = unjoin(base, target)
      }

      cb(null, target)
    })
  }
})

UNARY_SYNC_METHODS.forEach(function(name)
{
  const func = fs[name]
  if(!func) return

  ScopedFS.prototype[name] = function(src, ...args)
  {
    const base = this.base
    src = join(base, src)
    if(!src) throw new Error('Invalid path')

    let target = func(src, ...args)

    if(path.isAbsolute(target))
    {
      if(!target.startsWith(base)) throw new Error('Invalid target path')

      target = unjoin(base, target)
    }

    return target
  }
})


module.exports = ScopedFS

ScopedFS.FSWatcher   = fs.FSWatcher
ScopedFS.ReadStream  = fs.ReadStream
ScopedFS.Stats       = fs.Stats
ScopedFS.WriteStream = fs.WriteStream
ScopedFS.constants   = fs.constants


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
