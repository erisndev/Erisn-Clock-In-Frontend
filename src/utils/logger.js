const isProduction = import.meta.env.PROD;
const envFlag = import.meta.env.VITE_ENABLE_LOGS;

// Determine whether logging is enabled
const isEnabled = (() => {
  if (envFlag === "true") return true;
  if (envFlag === "false") return false;
  return !isProduction; // default: on in dev, off in prod
})();

// Silent no-op function
const noop = () => {};

const logger = {
  log: isEnabled ? console.log.bind(console) : noop,
  info: isEnabled ? console.info.bind(console) : noop,
  warn: isEnabled ? console.warn.bind(console) : noop,
  error: isEnabled ? console.error.bind(console) : noop,
  debug: isEnabled ? console.debug.bind(console) : noop,
  table: isEnabled ? console.table.bind(console) : noop,
  group: isEnabled ? console.group.bind(console) : noop,
  groupEnd: isEnabled ? console.groupEnd.bind(console) : noop,
  time: isEnabled ? console.time.bind(console) : noop,
  timeEnd: isEnabled ? console.timeEnd.bind(console) : noop,
};

export default logger;
