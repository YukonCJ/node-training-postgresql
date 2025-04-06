const router = require("express").Router();

const logger = require("../utils/logger")("Admin");
const { dataSource } = require("..db/dataSource");
const validators = require("../utils/typeValidation");

const courseRepo = dataSource.getRepository("Course");
const userRepo = dataSource.getRepository("User");
const coachRepo = dataSource.getRepository("Coach");

// 新增教練的課程資料
// 檢查body資料型別 400
// 檢查使用者使否存在 400
// 檢查skillID是否存在 400
router.post("/coaches/courses", async (req, res, next) => {
  try {
    const {
      user_id: userId,
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    } = req.body;
    if (
      validators.isUndefinedOrNull(userId) ||
      validators.isNotValidString(userId) ||
      validators.isUndefinedOrNull(skillId) ||
      validators.isNotValidString(skillId) ||
      validators.isUndefinedOrNull(name) ||
      validators.isNotValidString(name) ||
      validators.isUndefinedOrNull(description) ||
      validators.isNotValidString(description) ||
      validators.isUndefinedOrNull(startAt) ||
      validators.isNotValidString(startAt) ||
      validators.isUndefinedOrNull(endAt) ||
      validators.isNotValidString(endAt) ||
      validators.isUndefinedOrNull(maxParticipants) ||
      validators.isNotValidInteger(maxParticipants) ||
      validators.isUndefinedOrNull(meetingUrl) ||
      validators.isNotValidString(meetingUrl) ||
      !meetingUrl.startsWith("https")
    ) {
      logger.warn("欄位未填寫正確");
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    // 檢查user是否存在
    const user = await userRepo.findOne({
      where: { id: userId },
    });
    if (!user) {
      res.status(400).json({
        status: "failed",
        message: "使用者不存在",
      });
      return;
    } else if (user.role !== "COACH") {
      res.status(400).json({
        status: "failed",
        message: "使用者不是教練",
      });
      return;
    }
    // 檢查skillID是否存在
    const skill = await dataSource
      .getRepository("Skill")
      .findOne({ where: { id: skillId } });
    if (!skill) {
      res.status(400).json({
        status: "failed",
        message: "SKILL不存在",
      });
      return;
    }
    // 新增課程資料
    const newCourse = courseRepo.create({
      user_id: userId,
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    });
    const result = await courseRepo.save(newCourse);

    res.status(210).json({
      status: "success",
      data: {
        course: result,
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});
// 新增為教練角色
// 檢查body資料型別 400
// 檢查使用者使否存在 400
// 是否已經是教練 409
// 更新user是否成功 400
// 新增教練資料 & 回傳新增與更新後資料 201
router.post("/coaches/:userId", async (req, res, next) => {
  try {
    // 解構取得request body
    const {
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl,
    } = req.body;
    const { userId } = req.params;
    // 型別檢查
    if (
      validators.isUndefinedOrNull(experienceYears) ||
      validators.isNotValidInteger(experienceYears) ||
      validators.isUndefinedOrNull(description) ||
      validators.isNotValidString(description)
    ) {
      logger.warn("欄位未填寫正確");
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    if (
      validators.isUndefinedOrNull(profileImageUrl) ||
      validators.isNotValidString(profileImageUrl) ||
      !profileImageUrl.startsWith("https")
    ) {
      logger.warn("大頭貼網址錯誤");
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    // 資料庫查詢user
    const existUser = await userRepo.findOne({
      where: { id: userId },
    });
    // user不存在 or 角色已是教練
    if (!existUser) {
      logger.warn("User不存在");
      res.status(400).json({
        status: "failed",
        message: "User不存在",
      });
      return;
    } else if (existUser.role === "COACH") {
      logger.warn("User已是教練");
      res.status(409).json({
        status: "failed",
        message: "User已是教練",
      });
      return;
    }
    // 更新使用者角色為教練
    const updatedUser = await userRepo.update(
      {
        id: userId,
      },
      {
        role: "COACH",
      }
    );
    if (updatedUser.affected === 0) {
      logger.error("更新使用者失敗");
      res.status(400).json({
        status: "failed",
        message: "更新使用者失敗",
      });
      return;
    }
    // 新增教練資料
    const newCoach = await coachRepo.create({
      user_id: userId,
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl,
    });
    const saveCoach = await coachRepo.save(newCoach);
    // 查詢新增後教練資料
    const saveUser = await userRepo.findOne({
      select: ["name", "role"],
      where: { id: userId },
    });
    res.status(201).json({
      status: "success",
      data: {
        user: saveUser,
        coach: saveCoach,
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});
// 編輯教練課程資料
router.put("/coaches/courses/:courseId", async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const {
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    } = req.body;
    if (
      isNotValidSting(courseId) ||
      isUndefined(skillId) ||
      isNotValidSting(skillId) ||
      isUndefined(name) ||
      isNotValidSting(name) ||
      isUndefined(description) ||
      isNotValidSting(description) ||
      isUndefined(startAt) ||
      isNotValidSting(startAt) ||
      isUndefined(endAt) ||
      isNotValidSting(endAt) ||
      isUndefined(maxParticipants) ||
      isNotValidInteger(maxParticipants) ||
      isUndefined(meetingUrl) ||
      isNotValidSting(meetingUrl) ||
      !meetingUrl.startsWith("https")
    ) {
      logger.warn("欄位未填寫正確");
      res.status(400).json({
        status: "failed",
        message: "欄位未填寫正確",
      });
      return;
    }
    const findCourse = await courseRepo.findOne({
      where: { id: courseId },
    });
    if (!findCourse) {
      res.status(400).json({
        status: "failed",
        message: "課程不存在",
      });
      return;
    }
    const updateCourse = await courseRepo.update(
      { id: courseId },
      {
        skill_id: skillId,
        name,
        description,
        start_at: startAt,
        end_at: endAt,
        max_participants: maxParticipants,
        meeting_url: meetingUrl,
      }
    );
    if (updateCourse.affected === 0) {
      res.status(400).json({
        status: "failed",
        message: "更新課程失敗",
      });
      return;
    }
    const updatedCourse = await courseRepo.findOne({
      where: { id: courseId },
    });

    res.status(210).json({
      status: "success",
      data: {
        course: updatedCourse,
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});
