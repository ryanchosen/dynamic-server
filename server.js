var http = require("http");
var fs = require("fs");
var url = require("url");
var port = process.argv[2];

if (!port) {
  console.log("请指定端口号好不啦？\nnode server.js 8888 这样不会吗？");
  process.exit(1);
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true);
  var pathWithQuery = request.url;
  var queryString = "";
  if (pathWithQuery.indexOf("?") >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
  }
  var path = parsedUrl.pathname;
  var query = parsedUrl.query;
  var method = request.method;

  /******** 从这里开始看，上面不要看 ************/

  console.log("有个傻子发请求过来啦！路径（带查询参数）为：" + pathWithQuery);
  console.log(request.headers); //输出请求头
  // 这里写了一个静态服务器，静态服务器的意思就是用于提供静态资源访问的功能，如图片、CSS、JS等
  // 不支持动态页面和数据库的服务器
  if (path === "/home.html") {
    // 每次进入homepage时把标记位置替换成检测userId、
    // 我们使用了session技术，也就不能直接拿到userId，只能拿到session值也就是一个随机数
    const cookie = request.headers["cookie"]; // cookie里面放的完全可能不止一个值，可能是一众
    var re = /session_Id=([0-9]{1,}[.][0-9]*)/i; // 声明正则，用捕获组获取数字
    // 捕获组里的数字
    let sessionId = cookie?cookie.match(re)[1]:null; // userId 是字符串
    const homeHtml = fs.readFileSync("./public/home.html").toString();
    const sessionJson = JSON.parse(fs.readFileSync("./session.json"));
    const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
    let newHomeHtml;
    if (sessionId && sessionJson[sessionId]) {
      let userId = sessionJson[sessionId]["user_id"];
      let userObj = userArray.find((item) => item.id === userId);
      let userName = userObj.name;
      newHomeHtml = homeHtml.replace(
        "{{loginStatus}}",
        `已登录,欢迎用户${userName}`
      );
    } else {
      newHomeHtml = homeHtml.replace("{{loginStatus}}", "未登录");
    }
    response.write(newHomeHtml);
    response.end("home");
  } else if (path === "/register" && method === "POST") {
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    let userArray = JSON.parse(fs.readFileSync("./db/users.json"));
    let lastUser = userArray[userArray.length - 1];
    let lastUserId = lastUser ? lastUser.id : 0;
    const array = [];
    // 回调函数，当有数据上传时就一点点的放到这个数组里面，因为数据大的话就是要分段
    request.on("data", (chunk) => {
      array.push(chunk);
    });
    request.on("end", () => {
      // 这句话不用深究，合成字符串
      const string = Buffer.concat(array).toString();
      const obj = JSON.parse(string);
      let newUser = {
        id: lastUserId + 1,
        name: obj.name,
        password: obj.password,
      };
      userArray.push(newUser); // push return 3
      let newString = JSON.stringify(userArray);
      fs.writeFileSync("./db/users.json", newString);
      console.log(string);
      response.write("很好");
      response.end();
    });
  } else if (path === "/sign_in" && method === "POST") {
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    let userArray = JSON.parse(fs.readFileSync("./db/users.json"));
    const array = [];
    // 回调函数，当有数据上传时就一点点的放到这个数组里面，因为数据大的话就是要分段
    request.on("data", (chunk) => {
      array.push(chunk);
    });
    request.on("end", () => {
      // 这句话不用深究，合成字符串
      const string = Buffer.concat(array).toString();
      const obj = JSON.parse(string);
      const user = userArray.find(
        (user) => user.name === obj.name && user.password === obj.password
      );
      if (user === undefined) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "text/json;charset=utf-8");
        response.end(`{"errorCode":4001}`);
      } else {
        response.statusCode = 200;
        const randomNumber = Math.random();
        // 本来是把cookie比如userId:1直接设置到浏览器，是可以让客户端有潜在可能能够篡改
        // 但是为了防止篡改，更加安全，把cookie值比如userId:1放到session.json里面去
        // 并且交给客户端一个session值其实也就是随机数
        // 相当于利用session去间接地完成cookie查询
        let session = JSON.parse(fs.readFileSync("./session.json"));
        session[randomNumber] = { user_id: user.id };
        fs.writeFileSync("./session.json", JSON.stringify(session));
        response.setHeader("Set-Cookie", `session_id=${randomNumber};HttpOnly`);
        response.end("登陆成功");
      }
    });
  } else {
    // 默认首页
    const localpath = path === "/" ? "/index.html" : path;
    response.statusCode = 200;
    // 动态获取用户输入的文件类型以设置正确的content-type
    let index = localpath.lastIndexOf(".");
    let filetype = localpath.substring(index);
    const filetypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".png": "image/png",
    };
    response.setHeader("Content-Type", `${filetypes[filetype]};charset=utf-8`);
    response.setHeader("Ryan", "GettingBetter"); //设置响应头
    //response.write 设置响应体的内容
    let content;
    try {
      content = fs.readFileSync(`./public${localpath}`);
    } catch (error) {
      content = "文件不存在";
      response.statusCode = 404;
    }
    response.write(content);
    response.end();
  }

  /******** 代码结束，下面不要看 ************/
});

server.listen(port);
console.log(
  "监听 " +
    port +
    " 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:" +
    port
);
