// Include gulp
var gulp = require('gulp'); 

// Include Our Plugins
var jshint = require('gulp-jshint');
var closure = require('gulp-closure-compiler');
var jsdoc = require('gulp-jsdoc');
var concat = require('gulp-concat');

// Lint
gulp.task('lint', function() {
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('check', function(){
    // Perform type checking, etc. with closure compiler
    gulp.src('build/boltzmann.js')
        .pipe(closure({
            compilerPath: '/usr/share/java/closure-compiler/closure-compiler.jar',
            fileName: 'boltzmann.min.js',
            compilerFlags: {
                warning_level: 'VERBOSE',
                summary_detail_level: 1
            }
        }))
});

// Compress/minify
gulp.task('compress', ['scripts'], function(){
    gulp.src('build/boltzmann.js')
        .pipe(closure({
            compilerPath: '/usr/share/java/closure-compiler/closure-compiler.jar',
            fileName: 'boltzmann.min.js',
            compilerFlags: {
                warning_level: 'QUIET',
                compilation_level: 'SIMPLE_OPTIMIZATIONS'
            }
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('scripts', function() {
  gulp.src(['src/boltzmann.js'])
    .pipe(concat('boltzmann.js'))
    .pipe(gulp.dest('./build/'))
});

// Build documentation
gulp.task('docs', function() {
    gulp.src('src/**/*.js')
        .pipe(jsdoc('docs'));
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.{js,html}', ['lint']);
});

// Default Task
gulp.task('default', ['lint', 'watch']);
gulp.task('compile', ['compress']);
gulp.task('check', ['lint', 'check']);