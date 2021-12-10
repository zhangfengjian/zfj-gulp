# 封装工作流步骤


1. 创建git仓库用于维护

2. 创建工作流的目录结构

3. 关联远程仓库并上传代码

4. 拷贝gulpfile文件以及package.json中的文件,运行yarn安装依赖

5. 将当前工作流作为一个module关联到yarn全局环境 (通常用于本地调试)

6. 到项目目录中通过yarn link zfj-gulp 引入模块（通过软连接的方式）unlink删除软链接

7. 在项目中安装项目依赖

8. yarn gulp build 报错gulp不存在，本地调试，node_modules的bin中不包含该命令，项目中直接安装

9. 报错修改 pipe(plugin.babel({ presets: [require('@babel/preset-env')] }))

10. package.json的引用错误 const cwd = process.cwd(); {pkg: require(cwd + '/package.json')}

11. 使用gulp-cli运行node_modules下的gulpfile, 此时可以删除项目下的gulpfile文件
yarn gulp --gulpfile ./node_modules/zfj-gulp/lib/index.js --cwd .

12. 在bin目录下新建可执行文件zfj-gulp.js
#!/usr/bin/env node

// 定义参数
process.argv.push('--cwd');
process.argv.push(process.cwd());

process.argv.push('--gulpfile');
// process.argv.push(require.resolve('../lib/index.js'))
process.argv.push(require.resolve('..'))
// ..会去找package.json的main字段

require('gulp/bin/gulp');


13. yarn link 生成全局指令

14. 直接zfj-gulp build

15. 增加可扩展性，通过外部的config文件配置路径以及基础数据