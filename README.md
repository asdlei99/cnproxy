# CNProxy

CNProxy是一个CLI代理工具

[![Build Status](https://secure.travis-ci.org/goddyZhao/cnproxy.png)](http://travis-ci.org/goddyZhao/cnproxy)

## 为什么选择CNProxy

也许你有这样的疑问，为什么我们有了 [Fiddler](http://www.fiddler2.com/fiddler2/), [Charles](http://www.charlesproxy.com/), [Rythem](http://www.alloyteam.com/2012/05/web-front-end-tool-rythem-1/) 和 [Tinyproxy](https://banu.com/tinyproxy/)还需要CNProxy？是的，毫无疑问,他们都是伟大的工具,但他们不符合我的要求:

* 支持Mac、Linux和Windows(尤其是Mac和Linux)
* 支持更换组合文件与源文件分开
* 支持目录映射

这是要使用CNProxy的主要原因。此外,CNProxy可以提高日常开发企业级产品的效率与一堆复杂的构建过程。

I've written a post named [NProxy: The Mjolnir for UI Developers](http://en.blog.goddyzhao.me/post/29470818841/cnproxy-the-mjolnir-for-ui-developers)  and a keynote [NProxy: A Sharp Weapon for UI Developers](https://speakerdeck.com/u/goddyzhao/p/cnproxy-a-sharp-weapon-for-ui-developers) to explain my reason for developing NProxy in detail.

## 产品特点

* 支持Mac、Linux和Windows
* 同时支持单文件和组合文件
* 支持目录映射与任何文件
* 同时支持HTTP和HTTPS

## 安装说明

    npm install -g cnproxy (node >= v0.8.x is required)

如果你不熟悉Node.JS和NPM,你可以访问 [NPM包管理器介绍](http://www.runoob.com/nodejs/nodejs-npm.html)

## 使用方法

    cnproxy -l replace_rule.js

    设置浏览器的代理127.0.0.1:(默认端口9010)

如果你不知道如何设置浏览器代理,请阅读这篇文章: [如何设置浏览器代理](http://jingyan.baidu.com/article/fedf0737761a2935ac8977d9.html)


### 选项介绍:

    使用: cnproxy [选项]

    选项:

      -h, --help         显示cnproxy帮助信息
      -V, --version      显示当前cnproxy版本号
      -l, --list [list]  指定代理所需的规则文件
      -p, --port [port]  自定义代理端口号(默认端口:9010)
      -t, --timeout [timeout] 设置超时时间 (默认:5秒)

## 代理模板规则文件(请使用一个.js文件)

    module.exports = [

      // 1. replace single file with local one
      {
        pattern: 'homepage.js',      // Match url you wanna replace
        responder:  "/home/goddyzhao/workspace/homepage.js"
      },

      // 2. replace single file with web file
      {
        pattern: 'homepage.js',      // Match url you wanna replace
        responder:  "http://www.anotherwebsite.com/assets/js/homepage2.js"
      },

      // 3. replace combo file with src with absolute file path
      {
        pattern: 'group/homepageTileFramework.*.js',
        responder: [
          '/home/goddyzhao/workspace/webapp/ui/homepage/js/a.js',
          '/home/goddyzhao/workspace/webapp/ui/homepage/js/b.js',
          '/home/goddyzhao/workspace/webapp/ui/homepage/js/c.js'
        ]
      },

      // 4. replace combo file with src with relative file path and specified dir
      {
        pattern: 'group/homepageTileFramework.*.js',
        responder: {
          dir: '/home/goddyzhao/workspace/webapp/ui/homepage/js',
          src: [
            'a.js',
            'b.js',
            'c.js'
          ]
        }
      },

      // 5. Map server image directory to local image directory
      {
        pattern: 'ui/homepage/img',  // must be a string
        responder: '/home/user/image/' //must be a absolute directory path
      },

      // 6. Write responder with regular expression variables like $1, $2
      {
        pattern: /https?:\/\/[\w\.]*(?::\d+)?\/ui\/(.*)_dev\.(\w+)/,
        responder: 'http://localhost/proxy/$1.$2'
      },

      // 7. Map server image directory to local image directory with regular expression
      // This simple rule can replace multiple directories to corresponding locale ones
      // For Example,
      //   http://host:port/ui/a/img/... => /home/a/image/...
      //   http://host:port/ui/b/img/... => /home/b/image/...
      //   http://host:port/ui/c/img/... => /home/c/image/...
      //   ...
      {
        pattern: /ui\/(.*)\/img\//,
        responder: '/home/$1/image/'
      }
    ];

You can use the [template file](https://github.com/goddyzhao/cnproxy/blob/master/replace-rule.sample.js) and replace it with your own configurations.

## Quickly setup rule files for SF project

For UI Developers from SuccessFactors, here is a bonus for you guys. You can use the [sf-transfer](http://goddyzhao.github.com/sf-transfer) tool to transfer the combo xml file to NProxy rule file automatically!

## 开源许可证

CNProxy 使用 MIT 许可
