#!/usr/bin/env node

var test = require('tape')
var fs = require('fs')
var ScopedFS = require('./index')

test('Reads are constrained to the given dir', t => {
  var indexjs = fs.readFileSync('./index.js', 'utf8')
  var sfs = new ScopedFS(__dirname)
  sfs.readFile('index.js', 'utf8', (err, v) => {
    t.error(err)
    t.same(indexjs, v)
    sfs.readFile('/index.js', 'utf8', (err, v) => {
      t.error(err)
      t.same(indexjs, v)
      sfs.readFile('../index.js', 'utf8', (err, v) => {
        t.ok(!!err)
        t.end()
      })
    })
  })
})
