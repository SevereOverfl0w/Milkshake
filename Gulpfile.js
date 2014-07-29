var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    wiredep = require('wiredep').stream,
    lazypipe = require('lazypipe'),
    pngcrush = require('imagemin-pngcrush'),
    runSequence = require('run-sequence'),
    args  = require('yargs').argv,
    folders = {
        app: 'app',
        tmp: '.tmp',
        dist: 'dist',
    },
    globs = {
        templates: folders.app + '/*.{jade,html}',
        javascript: folders.app + '/**/*.js',
        coffee: folders.app + '/**/*.coffee',
        styles: folders.app + '/**/*.{scss,sass,css}',
        image: folders.app + '/**/*.{png,jpeg,jpg,gif,svg}'
    },
    ignore_dir = ['!' + folders.app + '/{bower_components,bower_components/**}'];

    // add ignores to globs
    for (glob in globs){
        globs[glob] = [globs[glob]].concat(ignore_dir);
    }

var isBuild = args.build !== undefined,
    isDev = !isBuild;

function boolAndRegex(bool, regex) {
    return function(file) {
        return $.match(file, regex) && bool;
    }
}

gulp.task('templates', function() {
    return gulp.src(globs.templates)
               .pipe($.plumber())
               .pipe($.if('*.jade', $.jade({pretty: true}))) // Fix for useref
               .pipe($.if(isDev, gulp.dest(folders.tmp)))
               .pipe($.if(isDev, reload({stream: true})))
               .pipe($.if(isBuild, $.useref.assets({
                    searchPath: [folders.app, folders.tmp]
               })))
               .pipe($.if(boolAndRegex(isBuild, '*.js'), $.uglify()))
               .pipe($.if(boolAndRegex(isBuild, '*.css'), $.minifyCss()))
               .pipe($.if(isBuild, $.useref.restore()))
               .pipe($.if(isBuild, $.useref()))
               .pipe($.if(boolAndRegex(isBuild, '*.html'), $.minifyHtml()))
               .pipe($.if(isBuild, gulp.dest(folders.dist)));
});


gulp.task('javascript', function() {
    return gulp.src(globs.javascript)
               .pipe($.plumber())
               .pipe($.jshint({lookup: true}))
               .pipe($.jshint.reporter('jshint-stylish'))
               //.pipe($.if(isBuild, $.uglify()))
               .pipe($.if(isBuild, gulp.dest(folders.dist)))
               .pipe($.if(isDev, reload({stream: true})));
});

gulp.task('coffee', function() {
    return gulp.src(globs.coffee)
               .pipe($.plumber())
               .pipe($.coffeelint())
               .pipe($.coffeelint.reporter())
               .pipe($.coffee())
               //.pipe($.if(isDev, gulp.dest(folders.tmp)))
               .pipe($.if(isBuild, $.uglify()))
               //.pipe($.if(isBuild, gulp.dest(folders.dist)))
               .pipe(gulp.dest(folders.tmp)) // Should solve issue with useref
               .pipe($.if(isDev, reload({stream: true})));
});

gulp.task('styles', function() {
    return gulp.src(globs.sass)
               .pipe($.plumber())
               .pipe($.if('*.{scss,sass}', $.sass({errLogToConsole: true}))) // Monkey patch for gulp-sass
               .pipe($.autoprefixer())
               //.pipe($.if(isDev, gulp.dest(folders.tmp)))
               .pipe($.if(isBuild, $.minifyCss()))
               //.pipe($.if(isBuild, gulp.dest(folders.dist)))
               .pipe(gulp.dest(folders.tmp)) // Should solve issue with useref
               .pipe($.if(isDev, reload({stream: true})));
});

gulp.task('wiredep', function() {
    return gulp.src([].concat(globs.jade, globs.html, globs.sass))
               .pipe($.plumber())
               .pipe(wiredep())
               .pipe($.if(isDev, reload({stream: true})))
               .pipe(gulp.dest(folders.app));
});

gulp.task('image', function() {
    return gulp.src(globs.image)
               .pipe($.plumber())
               .pipe($.if(isBuild, $.imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngcrush()]
               })))
               .pipe($.if(isBuild, gulp.dest(folders.dist)))
});

gulp.task('watch', function() {
    for (var key in globs) {
        $.watch({glob: globs[key], name: key}, [key]);
    }
    
    $.watch({glob: 'bower.json', name: 'Wiredep'}, ['wiredep']);
});

gulp.task('connect', function() {
    browserSync({
        server: {
            baseDir: [folders.tmp, folders.app]
        }
    });
});

gulp.task('serve', ['watch', 'connect']);

gulp.task('default', ['wiredep', 'sass', 'coffee', 'javascript', 'html', 'templates', 'image']);

gulp.task('build', function(cb) {
    isBuild = true; isDev = false;
    runSequence(['coffee', 'sass'], ['wiredep', 'javascript', 'html', 'templates', 'image'], cb);
});
