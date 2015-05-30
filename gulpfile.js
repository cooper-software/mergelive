'use strict'

var browserify = require('browserify'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    gutil = require('gulp-util')

gulp.task('build', function ()
{
    return browserify(
        {
            entries: './lib',
            debug: true,
            bundleExternal: false,
            standalone: 'mergelive'
        })
        .bundle()
        .pipe(source('mergelive.min.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build/'))
})

gulp.task('default', ['build'])