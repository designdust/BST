"use strict";

var gulp = require("gulp"),
  sass = require("gulp-sass"),
  del = require("del"),
  uglify = require("gulp-uglify"),
  cleanCSS = require("gulp-clean-css"),
  rename = require("gulp-rename"),
  merge = require("merge-stream"),
  htmlreplace = require("gulp-html-replace"),
  autoprefixer = require("gulp-autoprefixer"),
  browserSync = require("browser-sync").create();

// Clean task
gulp.task("clean", function () {
  return del(["dist", "assets/css/app.css"]);
});

// Copy third party libraries from node_modules into /vendor
gulp.task("vendor:js", function () {
  return gulp
    .src([
      "./node_modules/bootstrap/dist/js/*",
      "./node_modules/jquery/dist/*",
      "!./node_modules/jquery/dist/core.js",
      "./node_modules/popper.js/dist/umd/popper.*",
      "./node_modules/fullpage.js/vendors/easings.min.js",
      "./node_modules/fullpage.js/dist/fullpage.js",
      "./node_modules/fullpage.js/vendors/scrolloverflow.js",
    ])
    .pipe(gulp.dest("./assets/js/vendor"));
});

// Copy font-awesome from node_modules into /fonts
gulp.task("vendor:fonts", function () {
  return gulp
    .src([
      "./node_modules/@fortawesome/fontawesome-free/**/*",
      "!./node_modules/@fortawesome/fontawesome-free/{less,less/*}",
      "!./node_modules/@fortawesome/fontawesome-free/{scss,scss/*}",
      "!./node_modules/@fortawesome/fontawesome-free/.*",
      "!./node_modules/@fortawesome/fontawesome-free/*.{txt,json,md}"
    ])
    .pipe(gulp.dest("./assets/fonts/font-awesome"));
});

// vendor task
gulp.task("vendor", gulp.parallel("vendor:fonts", "vendor:js"));

// Copy vendor's js to /dist
gulp.task("vendor:build", function () {
  var jsStream = gulp
    .src([
      "./assets/js/vendor/bootstrap.bundle.min.js",
      "./assets/js/vendor/jquery.slim.min.js",
      "./assets/js/vendor/popper.min.js",
      "./assets/js/vendor/fullpage.js"
    ])
    .pipe(gulp.dest("./dist/assets/js/vendor"));
  var fontStream = gulp
    .src(["./assets/fonts/font-awesome/**/*.*"])
    .pipe(gulp.dest("./dist/assets/fonts/font-awesome"));
  return merge(jsStream, fontStream);
});

// Copy SCSS(SASS) from node_modules to /assets/scss/
gulp.task("vendor:scss", function () {
  var bootstrapStream = gulp
    .src(["./node_modules/bootstrap/scss/**/*"])
    .pipe(gulp.dest("./assets/scss/bootstrap"));
  var fullpageStream = gulp
    .src(["./node_modules/fullpage.js/dist/fullpage.css"])
    .pipe(gulp.dest("./assets/dist/css"));
  return merge(bootstrapStream, fullpageStream);
});

// Compile SCSS(SASS) files
gulp.task(
  "scss",
  gulp.series("vendor:scss", function compileScss() {
    return gulp
      .src([
        "./assets/scss/*.scss"
      ])
      .pipe(
        sass
        .sync({
          outputStyle: "expanded"
        })
        .on("error", sass.logError)
      )
      .pipe(autoprefixer())
      .pipe(gulp.dest("./assets/css"));
  })
);

// Minify CSS
gulp.task(
  "css:minify",
  gulp.series("scss", function cssMinify() {
    return gulp
      .src([
        "./assets/css/*"
      ])
      .pipe(cleanCSS())
      .pipe(
        rename({
          suffix: ".min"
        })
      )
      .pipe(gulp.dest("./dist/assets/css"))
      .pipe(browserSync.stream());
  })
);

// Minify Js
gulp.task("js:minify", function () {
  return gulp
    .src(["./assets/js/app.js"])
    .pipe(uglify())
    .pipe(
      rename({
        suffix: ".min"
      })
    )
    .pipe(gulp.dest("./dist/assets/js"))
    .pipe(browserSync.stream());
});

// Replace HTML block for Js and Css file upon build and copy to /dist
gulp.task("replaceHtmlBlock", function () {
  return gulp
    .src(["*.html"])
    .pipe(
      htmlreplace({
        js: "assets/js/app.min.js",
        vendor: "assets/css/fullpage.min.css",
        scss: "assets/css/app.min.css"
      })
    )
    .pipe(gulp.dest("dist/"));
});

// Compile Only appcss
gulp.task("compileScss", function compileScss() {
  return gulp
    .src([
      "./assets/scss/app.scss"
    ])
    .pipe(
      sass
      .sync({
        outputStyle: "expanded"
      })
      .on("error", sass.logError)
    )
    .pipe(autoprefixer())
    .pipe(gulp.dest("./assets/css"));
});

// Watch Ony App Css
gulp.task("watchAppCss", function browserDev(done) {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
  gulp.watch(
    [
      "assets/scss/*.scss",
      "assets/scss/**/*.scss"
    ],
    gulp.series("compileScss", function cssBrowserReload(done) {
      browserSync.reload();
      done(); //Async callback for completion.
    })
  );
});

// Configure the browserSync task and watch file path for change
gulp.task("watch", function browserDev(done) {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
  gulp.watch(
    [
      "assets/scss/*.scss",
      "assets/scss/**/*.scss",
      "!assets/scss/bootstrap/**"
    ],
    gulp.series("css:minify", function cssBrowserReload(done) {
      browserSync.reload();
      done(); //Async callback for completion.
    })
  );
  gulp.watch(
    "assets/js/app.js",
    gulp.series("js:minify", function jsBrowserReload(done) {
      browserSync.reload();
      done();
    })
  );
  gulp.watch(["*.html"]).on("change", browserSync.reload);
  done();
});

// Build task
gulp.task(
  "build",
  gulp.series(
    gulp.parallel("css:minify", "js:minify", "vendor"),
    "vendor:build",
    function copyAssets() {
      return gulp
        .src(["*.html", "favicon.ico", "assets/img/**", "assets/video/**"], {
          base: "./"
        })
        .pipe(gulp.dest("dist"));
    }
  )
);

// Default task
gulp.task("default", gulp.series("clean", "build", "replaceHtmlBlock"));