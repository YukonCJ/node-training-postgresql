const router = require("express").Router();
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Skill");
const validators = require("../utils/typeValidation");
const { dataSource } = require("../db/data-source");

const skillRepo = dataSource.getRepository("Skill");

router.get("/", async (req, res, next) => {
  try {
    const skills = await skillRepo.find({
      select: ["id", "name"],
    });
    res.status(200).json({
      status: "success",
      data: skills,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (
      validators.isUndefinedOrNull(name) ||
      validators.isNotValidSting(name)
    ) {
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    const existSkill = await skillRepo.find({
      where: { name },
    });
    if (existSkill.length > 0) {
      res.status(409).json({
        status: "failed",
        message: "資料重複",
      });
      return;
    }
    const newSkill = skillRepo.create({ name });
    const result = await skillRepo.save(newSkill);
    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});
router.delete("/:id", (req, res, next) => {
  try {
    const skillId = req.params;
    if (
      validators.isUndefinedOrNull(skillId) ||
      validators.isNotValidString(skillId)
    ) {
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    const result = skillRepo.delete(skillId);
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
