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

// 获取配置文件
let config = {
  // 抽取路径
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp2',
    public: 'public',
    path: {
      page: '*.html',
      style: 'assets/styles/*.scss',
      script: 'assets/scripts/*.js',
      image: 'assets/images/**',
      font: 'assets/fonts/**'
    }
  }
}

try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = mergeObj(config, loadConfig)
} catch (err) {
  // 配置文件不存在
}
/***
 * 处理html模版
 */
const page = () => {
  return src(config.build.path.page, { base: config.build.src, cwd: config.build.src })
    .pipe(plugin.swig(
      {
        data: config.data,
        defaults: { cache: false }
      }
    ))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({stream: true}))
}

/**
 * 处理scss
 */
// src/assets/styles/*.s+(a|c)ss
const style = () => {
  return src(config.build.path.style, { base: config.build.src, cwd: config.build.src })
  .pipe(plugin.sassLint())
  .pipe(plugin.sassLint.format()) 
  .pipe(plugin.sassLint.failOnError())
  .pipe(plugin.sass(require('sass'))({outputStyle: 'expanded'}))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream: true}))
}

/***
 * 处理js
 */
const script = () => {
  return src(config.build.path.script, { base: config.build.src, cwd: config.build.src })
  .pipe(plugin.babel({ presets: [require('@babel/preset-env')] }))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream: true}))
}

/***
 * 处理img
 */
const image = () => {
  return src(config.build.path.image, { base: config.build.src, cwd: config.build.src })
  .pipe(plugin.imagemin())
  .pipe(dest(config.build.dist))
}

/**
 * 处理font文件
 */
 const font = () => {
  return src(config.build.path.font, { base: config.build.src, cwd: config.build.src })
  .pipe(plugin.imagemin())
  .pipe(dest(config.build.dist))
}

/**
 * 处理public
 */
const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
  .pipe(dest(config.build.dist))
}

/**
 * clean
 */
const clean = (cb) => {
  console.log(config, config.build.dist, config.build.temp)
  return del([config.build.dist, config.build.temp])
}


const serve = () => {
  watch(config.build.path.page, { cwd: config.build.src }, page)
  watch(config.build.path.style, { cwd: config.build.src },  style)
  watch(config.build.path.script, { cwd: config.build.src }, script)
  
  watch([
    config.build.path.image,
    config.build.path.font
  ], { cwd: config.build.src }, bs.reload) 
  watch([
    '**'
  ], { cwd: config.build.build }, bs.reload) 
  // 开发环境下是不需要压缩图片等操作，所以从src下获取
  
  bs.init({
    notify: false,
    open: true,
    port: 2080,
    // files: 'dist/**/',
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
  // 热更新方式一：监视dist文件夹，watch src下的文件，修改源代码，重新编译到dist，bs监视到文件变化，更新文件
  // 方式二：在每个watch的任务后手动调用bs.reload,重新加载浏览器，此时就不需要监视文件夹
}

const useref = () => {
  return src('*.html', { base: config.build. temp, cwd: config.build.temp })
  .pipe(plugin.useref({ searchPath: [config.build.temp, '.'] }))
  .pipe(plugin.if(/\.js$/, plugin.uglify()))
  .pipe(plugin.if(/\.css$/, plugin.cleanCss()))
  .pipe(plugin.if(/\.html$/, plugin.htmlmin({
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true
  })))
  .pipe(dest(config.build.dist))
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
  clean,
  compiler,
  build,
  develop
}

// 合并对象
function mergeObj (obj1, obj2) {
  Object.keys(obj2).forEach(prop => {
    if (prop in obj1 && typeof obj2[prop] === 'object') {
      mergeObj(obj1[prop], obj2[prop])
    } else {
      obj1[prop] = obj2[prop]
    }
  })
  return obj1
}