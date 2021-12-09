#!/usr/bin/env node

// 定义参数
process.argv.push('--cwd');
process.argv.push(process.cwd());

process.argv.push('--gulpfile');
// process.argv.push(require.resolve('../lib/index.js'))
process.argv.push(require.resolve('..'))
// ..会去找package.json的main字段

require('gulp/bin/gulp');
