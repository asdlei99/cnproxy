# CNProxy

CNProxy是一个CLI代理工具

## 为什么选择CNProxy

* 支持Mac、Linux和Windows(尤其是Linux和Mac)
* 支持更换组合文件与源文件分开
* 支持目录映射

这是要使用CNProxy的主要原因。此外,CNProxy可以提高日常开发企业级产品的效率与一堆复杂的构建过程。

## 产品特点

* 支持Mac、Linux和Windows
* 同时支持单文件和组合文件
* 支持目录映射与任何文件
* 同时支持HTTP和HTTPS

## 安装说明

    npm install -g cnproxy

如果你不熟悉Node.JS和NPM,你可以访问 [NPM包管理器介绍](http://www.runoob.com/nodejs/nodejs-npm.html)

## 使用方法

    cnproxy -l replace_rule.js

    设置浏览器的代理127.0.0.1:(默认端口9010)

如果你不知道如何设置浏览器代理,请阅读这篇文章: [如何设置浏览器代理](http://jingyan.baidu.com/article/fedf0737761a2935ac8977d9.html)

## 安装证书
    
    设置好代理后，访问 http://loadchange.com/getssl 安装证书
    
    IOS 11后的手机，安装好证书后还需要在 设置->通用->关于本机->证书信任设置-> 找到 CNProxy CA 将其打开



### 选项介绍:

    使用: cnproxy [选项]

    选项:

      -h, --help              显示cnproxy帮助信息
      -V, --version           显示当前cnproxy版本号
      -l, --list [list]       指定代理所需的规则文件
      -w, --watch [watch]       指定需要观察的URL列表
      -p, --port [port]       自定义代理端口号(默认端口:9010)
      -t, --timeout [timeout] 设置超时时间 (默认:5秒)
      -c, --cookies [cookies] 设置代理请求携带的cookies

## 代理模板规则文件(请使用一个.js文件)

    module.exports = [

      // 1. 与当地一个取代单一文件
      {
        pattern: 'homepage.js',      // 你想替换匹配url
        responder:  "/home/user/workspace/homepage.js"
      },

      // 2. 用web文件替换单一文件
      {
        pattern: 'homepage.js',      // 你想替换匹配url
        responder:  "http://www.anotherwebsite.com/assets/js/homepage2.js"
      },

      // 3. 组合文件替换为src与绝对的文件路径
      {
        pattern: 'group/homepageTileFramework.*.js',
        responder: [
          '/home/user/workspace/webapp/ui/homepage/js/a.js',
          '/home/user/workspace/webapp/ui/homepage/js/b.js',
          '/home/user/workspace/webapp/ui/homepage/js/c.js'
        ]
      },

      // 4. 组合文件替换为src相对文件路径和指定的dir
      {
        pattern: 'group/homepageTileFramework.*.js',
        responder: {
          dir: '/home/user/workspace/webapp/ui/homepage/js',
          src: [
            'a.js',
            'b.js',
            'c.js'
          ]
        }
      },

      // 5. 请求服务器的图片目录映射到本地图片目录
      {
        pattern: 'ui/homepage/img',  // 必须是一个字符串
        responder: '/home/user/image/' // 必须是一个绝对目录路径
      },

      // 6. 使用正则表达式
      {
        pattern: /https?:\/\/[\w\.]*(?::\d+)?\/ui\/(.*)_dev\.(\w+)/,
        responder: 'http://localhost/proxy/$1.$2'
      },

      // 7. 服务器映像目录映射到本地图像目录与正则表达式
      // 这个简单的规则可以替代多个目录相应的环境
      // 如下：
      //   http://host:port/ui/a/img/... => /home/a/image/...
      //   http://host:port/ui/b/img/... => /home/b/image/...
      //   http://host:port/ui/c/img/... => /home/c/image/...
      //   ...
      {
        pattern: /ui\/(.*)\/img\//,
        responder: '/home/$1/image/'
      },
      // 8. 使用cookies ,单独设置某一个匹配规则的cookies，
      // 如果需要将全部匹配的url统一设置cookies
      // 可以在启动cnproxy时使用-c 'cookies...'
      {
        pattern: /http:\/\/127.0.0.1:8080\/user\/upload\/(.*)$/,
        responder: 'http://www.qq.com/vip/upload/$1',
        cookies: '_xsrf=2|330a5789|c9627c4a257a5b6067094df2d9a1e1d8|1459947169; SESSION=e8eb5e4b-2ebc-413a-9055-e5b69471146d'
      }
    ];

您可以使用这份模板 [代理模板文件](https://github.com/LoadChange/cnproxy/blob/master/replace-rule.sample.js) 文件替换成自己的配置。

## 开源许可证

CNProxy 使用 MIT 许可
