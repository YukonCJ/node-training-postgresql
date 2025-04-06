const express = require("express");
const router = express.Router();

const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("CreditPackage");
const validators = require("../utils/typeValidation");

const creditPackageRepo = dataSource.getRepository("CreditPackage");

router.get("/", async (req, res, next) => {
  try {
    // 取資料庫credit_package資料
    const result = await creditPackageRepo.find({
      select: ["id", "name", "credit_amount", "price"],
    });
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    // 新增課程資訊
    const { name, credit_amount: creditAmount, price } = req.body;
    if (
      validators.isUndefinedOrNull(name) ||
      validators.isUndefinedOrNull(creditAmount) ||
      validators.isNotValidString(name) ||
      validators.isNotValidInteger(creditAmount) ||
      validators.isUndefinedOrNull(price) ||
      validators.isNotValidInteger(price)
    ) {
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    // 檢查資料是否重複
    const existCreditPurchase = await creditPackageRepo.find({
      where: {
        name,
      },
    });
    if (existCreditPurchase.length > 0) {
      res.status(409).json({
        status: "failed",
        message: "資料重複",
      });
      return;
    }
    // 新增資料 存入DB
    const newCreditPurchase = await creditPackageRepo.create({
      name,
      credit_amount: creditAmount,
      price,
    });
    const result = await creditPackageRepo.save(newCreditPurchase);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.delete("/:creditPackageId", async (req, res, next) => {
  try {
    const { creditPackageId } = req.params;
    // 型別檢查
    if (
      validators.isUndefinedOrNull(creditPackageId) ||
      validators.isNotValidString(creditPackageId)
    ) {
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    // 刪除資料
    const result = await creditPackageRepo.delete(creditPackageId);
    // 檢查受影響筆數
    if (result.affected === 0) {
      res.status(400).json({
        status: "failed",
        message: "ID錯誤",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
