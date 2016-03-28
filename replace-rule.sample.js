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
  }
];
