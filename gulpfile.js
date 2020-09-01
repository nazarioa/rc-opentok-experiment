const gulp = require("gulp");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const tsify = require("tsify");
const sourcemaps = require("gulp-sourcemaps");
const buffer = require("vinyl-buffer");
const paths = {
    pages: ["src/*.html"],
    favicon: ["src/favicon.ico"],
};

gulp.task("copy-html", () => gulp.src(paths.pages).pipe(gulp.dest("dist")));
gulp.task("copy-assets", () => gulp.src(paths.favicon).pipe(gulp.dest("dist")));

gulp.task(
    "default",
    gulp.series(
        gulp.parallel("copy-html", "copy-assets"), () =>
            browserify({
                basedir: ".",
                debug: true,
                entries: ["src/index.ts"],
                cache: {},
                packageCache: {},
            })
                .plugin(tsify)
                .transform("babelify", {
                    presets: ["es2015"],
                    extensions: [".ts"],
                })
                .bundle()
                .pipe(source("bundle.js"))
                .pipe(buffer())
                .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(sourcemaps.write("./"))
                .pipe(gulp.dest("dist"))
    )
);
