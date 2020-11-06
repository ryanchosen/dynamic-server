const fs=require("fs");

// .json模拟一个数据库
// 读数据库
const usersString=fs.readFileSync("./db/users.json").toString(); // 字符串类型
let usersArray=JSON.parse(usersString); // 字符串类型=>js对象
console.log(typeof usersString) // String
console.log(usersString)
console.log(typeof usersArray) // Object
console.log(usersArray instanceof Array) // true
console.log(usersArray)

// 写数据库
let newUser={id:3,name:'leo',password:'123'};
usersArray.push(newUser);
let newString=JSON.stringify(usersArray)
// 因为你拿出来是字符串所以给回去也要是字符串，而不能把数组推进去
fs.writeFileSync('./db/users.json',newString) 

