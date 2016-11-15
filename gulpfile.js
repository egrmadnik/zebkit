var gulp = require('gulp');

var jshint    = require('gulp-jshint'),
    concat    = require('gulp-concat'),
    wrap      = require("gulp-wrap"),
    uglify    = require('gulp-uglify'),
    rename    = require('gulp-rename'),
    webserver = require('gulp-webserver'),
    rm        = require('gulp-rm'),
    expect    = require('gulp-expect-file'),
    zip       = require('gulp-zip');

var zebkitFiles = [
    'src/js/easyoop.js',
    'src/js/layout.js',
    'src/js/util.js',
    'src/js/io.js',
    'src/js/data.js',
    'src/js/web.js',
    'src/js/ui.webstuff.js',
    'src/js/ui.webpointer.js',
    'src/js/ui.webkey.js',
    'src/js/ui.views.js',
    'src/js/ui.core.js',
    'src/js/ui.html.js',
    'src/js/ui.js',
    'src/js/ui.field.js',
    'src/js/ui.list.js',
    'src/js/ui.window.js',
    'src/js/ui.grid.js',
    'src/js/ui.tree.js',
    'src/js/ui.designer.js',
    'src/js/ui.bootstrap.js'
];

var demoFiles = [
    "samples/demo/ui.demo.js",
    "samples/demo/ui.demo.layout.js",
    "samples/demo/ui.demo.basicui.js",
    "samples/demo/ui.demo.panels.js",
    "samples/demo/ui.demo.tree.js",
    "samples/demo/ui.demo.popup.js",
    "samples/demo/ui.demo.win.js",
    "samples/demo/ui.demo.grid.js",
    "samples/demo/ui.demo.designer.js"
];


gulp.task('http', function() {
    gulp.src('.')
        .pipe(webserver({
            port: 8090,
            host: "localhost",
            directoryListing: true,
            open: false
        }));
});

gulp.task('lint', function() {
    return gulp.src(zebkitFiles)
          .pipe(expect(zebkitFiles))
          .pipe(jshint({ eqnull : true }))
          .pipe(jshint.reporter('default'));
});

gulp.task('theme', function() {
    return gulp.src([
                        "src/js/theme/**/zebkit.json",
                        "src/js/theme/**/zebkit.png"
                    ])
          .pipe(gulp.dest("build/theme"));
});

gulp.task('easyoop', function() {
    return gulp.src("src/js/easyoop.js")
          .pipe(rename('easyoop.min.js'))
          .pipe(uglify({ compress: false, mangle: false }))
          .pipe(gulp.dest("build"));
});

gulp.task('calendar', function() {
    return gulp.src("src/js/component/ui.date.js")
          .pipe(rename('ui.date.min.js'))
          .pipe(uglify({ compress: false, mangle: false }))
          .pipe(gulp.dest("build"));
});

gulp.task('vk', function() {
    return gulp.src("src/js/component/ui.vk.js")
          .pipe(rename('ui.vk.min.js'))
          .pipe(uglify({ compress: false, mangle: false }))
          .pipe(gulp.dest("build"));
});

gulp.task('zebkit', function() {
    return gulp.src(zebkitFiles)
          .pipe(expect(zebkitFiles))
          .pipe(concat('build/zebkit.js'))
          .pipe(gulp.dest("."))
          .pipe(rename('zebkit.min.js'))
          .pipe(uglify({ compress: false, mangle: false }))
          .pipe(gulp.dest("build"))
});

gulp.task('build', [ "zebkit", "theme", "calendar", "vk", "easyoop" ]);

gulp.task('runtime', [ "build" ], function () {
    return  gulp.src([
                "build/**/*"
            ])
           .pipe(zip('zebkit.runtime.zip'))
           .pipe(gulp.dest("build"))
});

gulp.task('samplescript', function() {
    return gulp.src("samples/js/uiengine.samples.js")
          .pipe(expect("samples/js/uiengine.samples.js"))
          .pipe(rename('uiengine.samples.min.js'))
          .pipe(uglify({ compress: false, mangle: false }))
          .pipe(gulp.dest('samples/js'));
});

gulp.task('demoscript', function() {
    return gulp.src(demoFiles)
        .pipe(expect(demoFiles))
        .pipe(concat('demo.all.js'))
        .pipe(gulp.dest('samples/demo'))
        .pipe(rename('demo.all.min.js'))
        .pipe(uglify({ compress: false, mangle: false }))
        .pipe(gulp.dest('samples/demo'));
});


gulp.task('website', function (gulpCallBack){
    var spawn  = require('child_process').spawn;
    var jekyll = spawn('jekyll', ['build', '-d', 'build/website', '-s', 'src/jekyll/' ], { stdio: 'inherit' });

    jekyll.on('exit', function(code) {
        gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
    });
});

gulp.task('apidoc', function (gulpCallBack){
    var spawn  = require('child_process').spawn;
    var yuidoc = spawn('yuidoc', ['-t', 'node_modules/yuidoc-zebkit-theme',
                                  '-H', 'node_modules/yuidoc-zebkit-theme/helpers/helpers.js',
                                  "-o", "build/apidoc",
                                  "-n",
                                  'build/.' ], { stdio: 'inherit' });

    yuidoc.on('exit', function(code) {
        gulpCallBack(code === 0 ? null : 'ERROR: yuidoc process exited with code: ' + code);
    });
});


gulp.task('clean', function() {
    return gulp.src([ 'build/**/*' ], { read: false })
           .pipe(rm());
});

gulp.task('default', ['zebkit', 'runtime']);

gulp.task('watch', function() {
    gulp.watch(zebkitFiles, ['zebkit']);
    //gulp.watch(demoFiles,   ['demoscript']);
    //gulp.watch("samples/js/uiengine.samples.js", ['samplescript']);
});

//gulp.task('scripts', [ "demoscript", "samplescript", "zebkit", 'datescript', 'vkscript', 'copy']);

