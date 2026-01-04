var g = require('gulp'),
    $ = require('gulp-load-plugins')(),
    b = require('Browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');


// Configuration
// =============

var js = {
    input: '_js',
    output: 'js'
};

var css = {
    input: '_css',
    output: 'css'
};

// JS Tasks
// ========

g.task('js', () => {
    return b({
        entries: js.input+'/wishbanana.js',
        debug: true
    }).bundle()
    .pipe(source('wishbanana.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({ loadMaps: true }))
        .pipe($.uglify())
        .on('error', $.util.log)
    .pipe($.sourcemaps.write('./'))
    .pipe(g.dest(js.output));
});


// CSS Tasks
// ==========

g.task('css', () => {
    var sass = $.sass().on('error', $.sass.logError);

    var autoprefixer = $.autoprefixer({
        browsers: ['last 2 versions', 'ie >= 9']
    });

    return g.src(css.input + '/wishbanana.scss')
        .pipe($.sourcemaps.init())
        .pipe(sass)
        .pipe(autoprefixer)
        .pipe($.sourcemaps.write())
        .pipe(g.dest(css.output));
});


// Clean Tasks
// ===========

g.task('clean-css', () => {
    return g.src(css.output).pipe($.clean());
});

g.task('clean-js', () => {
    return g.src(js.output).pipe($.clean());
});

g.task('clean', ['clean-css', 'clean-js']);


// Watch Tasks
// ===========

g.task('watch', ['default'], () => {
    g.watch(css.input + '/*.scss', ['css']);
    g.watch(js.input + '/*.js', ['js']);
});


// Deploy Task
// ===========

g.task('deploy', ['default'], () => {
    return g.src('./{index.html,CNAME,css/*.css,js/*.js,assets/*.svg}')
        .pipe($.ghPages());
});


// Default Task
// ============

g.task('default', ['css', 'js']);
