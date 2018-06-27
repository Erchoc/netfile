/**
 
 Created by WebStorm.
 User: Erchoc
 Date: 2018/6/27 8:09
 Description:
 
 **/
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const handleBars = require('handlebars');

// 引入文件
const config = require('../config/defaultConfig');
const mime = require('../helper/mime');

// 利用promisify将异步操作同步化
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

// 同步方法获取目录，生成模板(读Buffer比String更快)
const tplPath = path.join(__dirname, '../view/listdir.html');
const source = fs.readFileSync(tplPath);
const template = handleBars.compile(source.toString());

module.exports = async function ( req, res, filePath ) {
  try {
    const stats = await stat(filePath);
    if (stats.isFile()) {
      const contentType = mime(filePath);
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      fs.createReadStream(filePath).pipe(res);
    } else if (stats.isDirectory()) {
      // 这里可能出现异常，这里只在最外层捕获异常
      const items = await readdir(filePath);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      // 处理更深层级的文件或目录
      const dir = path.relative(config.root, filePath);
      const data = {
        title: path.basename(filePath),
        dir: dir ? `/${dir}` : '',
        items: items.map(item => {
          return {
            item,
            icon: mime(item)
          };
        })
      };
      res.end(template(data));
    }
  } catch (ex) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`${filePath} is not a directory or file\n ${ex.toString()}`);
  }
};


