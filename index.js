const path = require('path')
const fs = require('fs')
const watch = require('recursive-watch')

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/

const METHODS = ['createReadStream', 'readFile', 'createWriteStream',
                 'writeFile', 'mkdir', 'access', 'exists', 'lstat', 'stat',
                 'readdir', 'unlink', 'rmdir']


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

METHODS.forEach(function(name)
{
  ScopedFS.prototype[name] = function(path, ...args)
  {
    path = join(this.base, path)
    if(!path) return args[args.length-1](new Error('Invalid path'))
    return fs[name](path, ...args)
  }
})


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
