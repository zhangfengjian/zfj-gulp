const { src, dest, series, parallel, watch } = require('gulp');
const loadAllTasks = require('gulp-load-plugins')
const fs = require('fs')
const del = require('del');
const browserSync = require('browser-sync')
const bs = browserSync.create()
/***
 * 自动加载gulp插件
 */
const plugin = loadAllTasks()

// 获取命令行执行地方的文件路径
const cwd = process.cwd()

/***
 * 处理html模版
 */
const page = () => {
  console.log(plugin)
  return src('src/*.html', { base: 'src' })
    .pipe(
      plugin.data(
        function(file) {
          return JSON.parse(fs.readFileSync('./src/data/index.json'));
        }
      )
    )
    .pipe(plugin.swig(
      {
        data: {
          pkg: require(cwd + '/package.json'),
        },
        defaults: { cache: false }
      }
    ))
    .pipe(dest('temp'))
    .pipe(bs.reload({stream: true}))
}

/**
 * 处理scss
 */
// src/assets/styles/*.s+(a|c)ss
const style = () => {
  return src('src/assets/styles/*.scss', { base: 'src' })
  .pipe(plugin.sassLint())
  .pipe(plugin.sassLint.format()) 
  .pipe(plugin.sassLint.failOnError())
  .pipe(plugin.sass(require('sass'))({outputStyle: 'expanded'}))
  .pipe(dest('temp'))
  .pipe(bs.reload({stream: true}))
}

/***
 * 处理js
 */
const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' })
  .pipe(plugin.babel({ presets: [require('@babel/preset-env')] }))
  .pipe(dest('temp'))
  .pipe(bs.reload({stream: true}))
}

/***
 * 处理img
 */
const image = () => {
  return src('src/assets/images/**', { base: 'src' })
  .pipe(plugin.imagemin())
  .pipe(dest('dist'))
}

/**
 * 处理font文件
 */
 const font = () => {
  return src('src/assets/fonts/**',{ base:'src' })
  .pipe(plugin.imagemin())
  .pipe(dest('dist'))
}

/**
 * 处理public
 */
const extra = () => {
  return src('./public/**', { base: 'public' })
  .pipe(dest('dist'))
}

/**
 * clean
 */
const clean = (cb) => {
  return del(['dist', 'temp'])
}


const serve = () => {
  watch('src/*.html', page)
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**'
  ], bs.reload) 
  // 开发环境下是不需要压缩图片等操作，所以从src下获取
  
  bs.init({
    notify: false,
    open: true,
    port: 2080,
    // files: 'dist/**/',
    server: {
      baseDir: ['temp', 'src', 'public'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
  // 热更新方式一：监视dist文件夹，watch src下的文件，修改源代码，重新编译到dist，bs监视到文件变化，更新文件
  // 方式二：在每个watch的任务后手动调用bs.reload,重新加载浏览器，此时就不需要监视文件夹
}

const useref = () => {
  return src('./temp/*.html', { base: 'temp' })
  .pipe(plugin.useref({ searchPath: ['temp', '.'] }))
  .pipe(plugin.if(/\.js$/, plugin.uglify()))
  .pipe(plugin.if(/\.css$/, plugin.cleanCss()))
  .pipe(plugin.if(/\.html$/, plugin.htmlmin({
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true
  })))
  .pipe(dest('dist'))
}

// const compiler = parallel(page, style, script, image, font)
const compiler = parallel(page, style, script)

// 生产环境需要基础资源构建，图片，字体处理
const build = series(clean, parallel(series(compiler, useref), image, font, extra))

// 开发环境只需要基础资源的构建
const develop = series(compiler, serve)

//文件中的魔法注释使用useref，对于需要上线的第三方库进行处理
// const useref = () => {
//   src('./dist/*.html')
//   .pipe(plugin.useref({ searchPath: ['dist', '.'] }))
//   .pipe(dest('dist'))
// } 同文件夹下的读写会有冲突


module.exports = {
  compiler,
  build,
  develop
}