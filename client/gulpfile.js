var g = require('gulp'),
    $ = require('gulp-load-plugins')(),
    b = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    sass = require('gulp-sass')(require('sass'));


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
    .on('error', function(err) {
        console.error('Browserify error:', err.message);
        this.emit('end');
    })
    .pipe(source('wishbanana.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.uglify())
    .on('error', function(err) {
        console.error('Uglify error:', err.message);
        this.emit('end');
    })
    .pipe($.sourcemaps.write('./'))
    .pipe(g.dest(js.output));
});


// CSS Tasks
// ==========

g.task('css', () => {
    var autoprefixer = $.autoprefixer({
        browsers: ['last 2 versions', 'ie >= 9']
    });

    return g.src(css.input + '/wishbanana.scss')
        .pipe($.sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
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

g.task('clean', g.parallel('clean-css', 'clean-js'));


// Default Task
// ============

g.task('default', g.parallel('css', 'js'));


// Watch Tasks
// ===========

g.task('watch', g.series('default', () => {
    g.watch(css.input + '/*.scss', g.series('css'));
    g.watch(js.input + '/*.js', g.series('js'));
}));


// Deploy Task
// ===========

g.task('deploy', g.series('default', () => {
    return g.src('./{index.html,CNAME,css/*.css,js/*.js,assets/*.svg}')
        .pipe($.ghPages());
}));
