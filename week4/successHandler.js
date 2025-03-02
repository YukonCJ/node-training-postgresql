function successHandler(res, data) {
  const headers = {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*", // 是否支持跨網域
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE", // 可接受的API方法
    "Content-Type": "application/json", // 回傳json格式
  };
  res.writeHead(200, headers);
  res.write(
    JSON.stringify({
      status: "success",
      data: data,
    })
  );
  res.end();
}
module.exports = successHandler;
