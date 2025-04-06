const router = require("express").Router();
const bcrypt = require("bcrypt");

const logger = require("../utils/logger")("User");
const { dataSource } = require("../utils/dataSource");
const validators = require("../utils/typeValidation");

router.post("/signup", async (req, res, next) => {
  try {
    // 正規表達式：(至少一個數字)(一個小寫字母a-z)(一個大寫字母A_Z)(長度在8-16之間)
    const pwRgEx = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
    const { name, email, password } = req.body;
    // 型別檢查
    if (
      validators.isUndefinedOrNull(name) ||
      validators.isUndefinedOrNull(email) ||
      validators.isUndefinedOrNull(password) ||
      validators.isNotString(name) ||
      validators.isNotString(email) ||
      validators.isNotString(password)
    ) {
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    // 正規表達式測試密碼
    if (pwRgEx.test(password) === false) {
      logger.warn(
        "建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
      );
      res.status(400).json({
        status: "failed",
        message: "密碼格式不符合規定",
      });
      return;
    }
    const userRepo = await dataSource.getRepository("user");
    const existUser = await userRepo.findOne({ where: { email } });
    // 檢查Email是否重複使用
    if (existUser) {
      logger.warn("建立使用者錯誤: Email已使用");
      res.status(409).json({
        status: "failed",
        message: "Email已使用",
      });
      return;
    }
    // bcrypt雜湊密碼 鹽係數10
    const saltRounds = 10;
    const hashPw = await bcrypt.hash(password, saltRounds);
    // 新增使用者資料&儲存
    const newUser = userRepo.create({
      name,
      email,
      role: "user",
      password: hashPw,
    });
    const result = await userRepo.save(newUser);
    logger.info(`新建立的使用者ID:${result.id}`);
    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: result.id,
          name: result.name,
        },
      },
    });
  } catch (err) {
    logger.error(err);
    next(err);
  }
});

module.exports = router;
