require("dotenv").config();
const errorHandler = require("./errorHandler");
const successHandler = require("./successHandler");
const http = require("http");
const AppDataSource = require("./db");
const { v4: uuidv4 } = require("uuid");
const resHandler = require("./successHandler");

const creditPackageRoute = "/api/credit-package";
const skillRoute = "/api/coaches/skill";

function isUndefined(value) {
  return value === undefined;
}
function isNotValidSting(value) {
  return typeof value !== "string" || value.trim().length === 0 || value === "";
}
function isNotValidInteger(value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0;
}

const requestListener = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json",
  };
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  if (req.url === creditPackageRoute && req.method === "GET") {
    const repo = AppDataSource.getRepository("CreditPackage");
    const result = await repo.find({
      select: ["id", "name", "credit_amount", "price"],
    });
    successHandler(res, result);
  } else if (req.url === creditPackageRoute && req.method === "POST") {
    req.on("end", async () => {
      try {
        const body = JSON.parse(body);
        // 型別檢查
        if (
          isUndefined(body.name) ||
          isUndefined(body.credit_amount) ||
          isUndefined(body.price) ||
          isNotValidSting(body.name) ||
          isNotValidInteger(body.credit_amount) ||
          isNotValidInteger(body.price)
        ) {
          errorHandler(res, 400, "欄位未填寫正確");
          return;
        }
        // 檢查重複name
        const Repo = AppDataSource.getRepository("CreditPackage");
        const doppelganger = await Repo.find({ where: { name: body.name } });
        if (result.length > 0) {
          errorHandler(res, 409, "資料重複");
          return;
        }
        // 存入
        const newPackage = await Repo.create({
          name: body.name,
          credit_amount: body.credit_amount,
          price: body.price,
        });
        const result = await Repo.save(newPackage);
        successHandler(res, result);
      } catch (error) {
        errorHandler(res, 500, "error");
      }
    });
  } else if (
    req.url.startsWith(creditPackageRoute) &&
    req.method === "DELETE"
  ) {
    try {
      const id = req.url.split("/").pop();
      if (isUndefined(id) || isNotValidSting(id)) {
        errorHandler(res, 400, "ID錯誤");
        return;
      }
      const result = AppDataSource.getRepository("credit-package").delete(id);
      if (result.affected === 0) {
        errorHandler(res, 400, "ID錯誤");
        return;
      }
      successHandler(res);
    } catch (error) {
      errorHandler(res, 500, "伺服器錯誤");
    }
    const repo = AppDataSource.getRepository("CreditPackage");
  } else if (req.url === skillRoute && req.method === "GET") {
    const repo = AppDataSource.getRepository("Skill");
    const result = await repo.find({
      select: ["id", "name"],
    });
    successHandler(res, result);
  } else if (req.url === skillRoute && req.method === "POST") {
    req.on("end", async () => {
      try {
        const { name } = JSON.parse(body);
        // 檢查400
        if (isNotValidSting(name)) {
          errorHandler(res, 400, "欄位未填寫正確");
          return;
        }
        // 檢查409
        const Repo = AppDataSource.getRepository("Skill");
        const doppelganger = await Repo.find({ where: { name } });
        if (doppelganger.length > 0) {
          errorHandler(res, 409, "資料重複");
          return;
        }
        // post成功
        const newSkill = Repo.create({ name });
        const result = await Repo.save(newSkill);
        successHandler(res, result);
      } catch (error) {
        errorHandler(res, 500, "error");
      }
    });
  } else if (req.url.startsWith(skillRoute) && req.method === "DELETE") {
    try {
      const id = req.url.split("/").pop();
      if (isUndefined(id) || isNotValidSting(id)) {
        errorHandler(res, 400, "ID錯誤");
        return;
      }
      const result = AppDataSource.getRepository("Skill").delete(id);
      if (result.affected === 0) {
        errorHandler(res, 400, "ID錯誤");
        return;
      }
      successHandler(res);
    } catch (error) {
      errorHandler(res, 500, "伺服器錯誤");
    }
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    errorHandler(res, 404, "查無此路由");
  }
};

const server = http.createServer(requestListener);

async function startServer() {
  await AppDataSource.initialize();
  console.log("資料庫連接成功");
  server.listen(process.env.PORT);
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`);
  return server;
}

module.exports = startServer();
