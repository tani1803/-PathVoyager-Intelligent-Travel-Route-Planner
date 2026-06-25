const LOG_LEVELS = { INFO: "INFO", WARN: "WARN", ERROR: "ERROR" };

const format = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length
    ? " | " + JSON.stringify(meta)
    : "";
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

exports.info = (message, meta) => {
  console.log(format(LOG_LEVELS.INFO, message, meta));
};

exports.warn = (message, meta) => {
  console.warn(format(LOG_LEVELS.WARN, message, meta));
};

exports.error = (message, meta) => {
  console.error(format(LOG_LEVELS.ERROR, message, meta));
};
