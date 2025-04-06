function isUndefinedOrNull(value) {
  return value === undefined || value === null;
}

function isNotValidString(value) {
  return typeof value !== "string" || value.trim().length === 0 || value === "";
}

function isNotValidInteger(value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0;
}

module.exports = {
  isUndefinedOrNull,
  isNotValidString,
  isNotValidInteger,
};
