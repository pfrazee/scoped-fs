const test = require('ava')
const fs = require('fs')
const {promisify} = require('util')
const jetpack = require('fs-jetpack')
const tempy = require('tempy')
const ScopedFS = require('./index')

test('Reads are constrained to the given dir', async t => {
  var indexjs = fs.readFileSync('./index.js', 'utf8')
  var sfs = new ScopedFS(__dirname)
  promisifySFS(sfs)
  t.is(await sfs.readFile('index.js', 'utf8'), indexjs)
  t.is(await sfs.readFile('/index.js', 'utf8'), indexjs)
  await t.throws(sfs.readFile('../index.js', 'utf8'))
  t.is(sfs.readFileSync('index.js', 'utf8'), indexjs)
  t.is(sfs.readFileSync('/index.js', 'utf8'), indexjs)
  t.throws(() => sfs.readFileSync('../index.js', 'utf8'))
})

test('Filtering test', async t => {
  var sfs = new ScopedFS(createFixtures())
  promisifySFS(sfs)
  sfs.setFilter(filepath => {
    return ['/', '/foo.txt', '/bar.txt', '/subdir2', '/subdir2/bar.txt'].includes(filepath)
  })

  t.truthy(await sfs.readFile('/foo.txt'), 'readFile(/foo.txt)')
  await t.throws(sfs.readFile('/sub/bar.txt'), false, 'readFile(/sub/bar.txt)')

  await sfs.writeFile('/bar.txt', 'bar')
  await t.throws(sfs.writeFile('/sub/bar.txt', 'bar'), false, '/writeFile(/sub/bar.txt)')
  sfs.writeFileSync('/bar.txt', 'bar')
  t.throws(() => sfs.writeFileSync('/sub/bar.txt', 'bar'), false, '/writeFile(/sub/bar.txt)')
  
  await sfs.mkdir('/subdir2')
  await t.throws(sfs.mkdir('/subdir3'), false, 'mkdir(/subdir3)')
  
  await sfs.access('/bar.txt')
  await t.throws(sfs.access('/sub/bar.txt'), false, 'access(/sub/bar.txt)')
  
  t.is(await sfs.exists('/bar.txt'), true, 'exists(/bar.txt)')
  t.is(await sfs.exists('/sub/bar.txt'), false, 'exists(/sub/bar.txt)')
  
  t.truthy(await sfs.lstat('/bar.txt'), 'lstat(/bar.txt)')
  await t.throws(sfs.lstat('/sub/bar.txt'), false, 'lstat(/sub/bar.txt)')
  
  t.truthy(await sfs.stat('/bar.txt'), 'stat(/bar.txt)')
  await t.throws(sfs.stat('/sub/bar.txt'), false, 'stat(/sub/bar.txt)')
  
  t.deepEqual((await sfs.readdir('/')).sort(), ['foo.txt', 'bar.txt', 'subdir2'].sort(), 'readdir(/)')
  await t.throws(sfs.readdir('/sub'), false, 'readdir(/sub)')

  t.throws(() => sfs.watch('/sub'), false, 'watch(/sub)')
  await new Promise(resolve => {
    var watchHits = ['/foo.txt', '/subdir2/bar.txt']
    sfs.watch('/', subpath => {
      t.is(subpath, watchHits.shift())
      if (watchHits.length === 0) resolve()
    })
    setTimeout(() => {
      var dir = jetpack.dir(sfs.base)
      dir.write('foo.txt', 'fooo')
      dir.write('sub/foo.txt', 'fooo')
      dir.write('subdir2/bar.txt', 'barrrr')
      dir.remove('subdir2/bar.txt')
    }, 50)
  })

  await sfs.unlink('/bar.txt')
  await t.throws(sfs.unlink('/sub/bar.txt'), false, 'unlink(/sub/bar.txt)')

  await sfs.rmdir('/subdir2')
  try {
    await sfs.rmdir('/sub')
    t.fail('should have thrown')
  } catch (e) {
    t.is(e.causedByFiltering, true, 'rmdir(/sub)')
  }
})

function createFixtures () {
  var dirpath = tempy.directory()
  var dir = jetpack.dir(dirpath)
  dir.dir('sub')
  dir.write('foo.txt', 'foo')
  dir.write('sub/bar.txt', 'bar')
  return dirpath
}

function promisifySFS (sfs) {
  sfs.readFile = promisify(sfs.readFile.bind(sfs))
  sfs.writeFile = promisify(sfs.writeFile.bind(sfs))
  sfs.mkdir = promisify(sfs.mkdir.bind(sfs))
  sfs.access = promisify(sfs.access.bind(sfs))
  var _exists = sfs.exists
  sfs.exists = (p) => new Promise(resolve => _exists.call(sfs, p, resolve))
  sfs.lstat = promisify(sfs.lstat.bind(sfs))
  sfs.stat = promisify(sfs.stat.bind(sfs))
  sfs.readdir = promisify(sfs.readdir.bind(sfs))
  sfs.unlink = promisify(sfs.unlink.bind(sfs))
  sfs.rmdir = promisify(sfs.rmdir.bind(sfs))
}
