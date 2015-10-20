gulp     = require 'gulp'
plumber  = require 'gulp-plumber'
stylus   = require 'gulp-stylus'
watchify = require 'gulp-watchify'
connect  = require 'gulp-connect'
docco    = require 'gulp-docco'
babelify = require 'babelify'

watching = off

gulp.task 'enable-watch-mode', -> watching = on

gulp.task 'build:js', watchify (watchify) ->
  gulp.src './src/main.js'
    .pipe plumber()
    .pipe watchify
      watch     : watching
      extensions: ['.js']
      transform: ['babelify']
    .pipe gulp.dest './dist'

gulp.task 'build:stylus', ->
  gulp.src './styl/*.styl'
    .pipe plumber()
    .pipe stylus
      compress: true
    .pipe gulp.dest './stylesheets'

gulp.task 'build:doc', ->
  gulp.src "./src/*.js"
    .pipe plumber()
    .pipe docco()
    .pipe gulp.dest './doc'

gulp.task 'watch', ['enable-watch-mode', 'build:js'], ->
  gulp.watch ['./styl/*.styl'], ['build:stylus']

gulp.task 'connect', -> connect.server()
