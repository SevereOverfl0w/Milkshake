var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    wiredep = require('wiredep').stream,
    lazypipe = require('lazypipe'),
    args  = require('yargs').argv,
    config = {
        // folders
        app: 'app',
        tmp: '.tmp',
        dist: 'dist',

        // globs
        html: 'app/**/*.html',
        jade: 'app/**/*.jade',
        js: 'app/**/*.js',
        coffee: 'app/**/*.coffee',
        sass: 'app/**/*.{scss,sass}',
        image: 'app/**/*.{png,jpeg,jpg,gif,svg}'
    };

var isBuild = args.build !== undefined,
    isDev = !isBuild;

gulp.task('templates', function() {
    return gulp.src(config.jade)
               .pipe($.plumber())
               .pipe($.jade({pretty: true})) // Fix for useref
               .pipe($.if(isDev, gulp.dest(config.tmp)))
               .pipe($.if(isDev, reload({stream: true})))
               .pipe($.if(isBuild, $.useref.assets()))
               .pipe($.if('*.js', $.uglify()))
               .pipe($.if('*.css', $.minifyCss()))
               .pipe($.if(isBuild, $.useref.restore()))
               .pipe($.if(isBuild, $.useref()))
               .pipe($.if(isBuild, gulp.dest(config.dist)));
});

gulp.task('html', function() {
    return gulp.src(config.html)
               .pipe($.plumber())
               .pipe($.if(isDev, gulp.dest(config.tmp)))
               .pipe($.if(isDev, reload({stream: true})))
               .pipe($.if(isBuild, $.useref.assets()))
               .pipe($.if('*.js', $.uglify()))
               .pipe($.if('*.css', $.minifyCss()))
               .pipe($.if(isBuild, $.useref.restore()))
               .pipe($.if(isBuild, $.useref()))
               .pipe($.if(isBuild, $.minifyHtml()))
               .pipe($.if(isBuild, gulp.dest(config.dist)));
});

gulp.task('javascript', function() {
    return gulp.src(config.js)
               .pipe($.plumber())
               .pipe($.jshint({lookup: true}))
               .pipe($.jshint.reporter('jshint-stylish'))
               .pipe($.if(isBuild, $.uglify()))
               .pipe($.if(isBuild, gulp.dest(config.dist)))
               .pipe($.if(isDev, reload({stream: true})));
});

gulp.task('coffee', function() {
    return gulp.src(config.coffee)
               .pipe($.plumber())
               .pipe($.coffeelint())
               .pipe($.coffeelint.reporter())
               .pipe($.coffee())
               .pipe($.if(isDev, gulp.dest(config.tmp)))
               .pipe($.if(isBuild, $.uglify()))
               .pipe($.if(isBuild, gulp.dest(config.dist)))
               .pipe($.if(isDev, reload({stream: true})));
});

gulp.task('sass', function() {
    return gulp.src(config.sass)
               .pipe($.plumber())
               .pipe($.sass())
               .pipe($.autoprefixer())
               .pipe($.if(isDev, gulp.dest(config.tmp)))
               .pipe($.if(isBuild, $.minifyCss()))
               .pipe($.if(isBuild, gulp.dest(config.dist)))
               .pipe($.if(isDev, reload({stream: true})));
});

gulp.task('css', function() {
    return gulp.src(config.css)
               .pipe($.plumber())
               .pipe($.autoprefixer())
               .pipe($.if(isDev, gulp.dest(config.tmp)))
               .pipe($.if(isBuild, $.minifyCss()))
               .pipe($.if(isBuild, gulp.dest(config.dist)))
               .pipe($.if(isDev, reload({stream: true})));
});

gulp.task('wiredep', function() {
    return gulp.src([config.jade, config.html, config.sass])
               .pipe($.plumber())
               .pipe(wiredep())
               .pipe($.if(isDev, reload({stream: true})))
               .pipe(gulp.dest(config.app));
});

gulp.task('image', function() {
    return gulp.src([config.image])
               .pipe($.plumber())
               .pipe($.if(isBuild, $.imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngcrush()]
               })))
               .pipe($.if(isBuild, gulp.dest(config.dist)))
});

gulp.task('watch', function() {
    $.watch({glob: config.jade, name: 'Jade'}, ['templates']); 
    $.watch({glob: config.html, name: 'HTML'}, ['html']); 
    $.watch({glob: config.coffee, name: 'Coffee'}, ['coffee']); 
    $.watch({glob: config.js, name: 'JS'}, ['javascript']); 
    $.watch({glob: config.sass, name: 'Sass'}, ['sass']); 
    $.watch({glob: config.image, name: 'Image'}, ['image']); 
    $.watch({glob: 'bower.json', name: 'Wiredep'}, ['wiredep']);
});

gulp.task('connect', function() {
    browserSync({
        server: {
            baseDir: [config.tmp, config.app]
        }
    });
});

gulp.task('serve', ['watch', 'connect']);

gulp.task('default', ['wiredep', 'sass', 'coffee', 'javascript', 'html', 'templates', 'image']);
