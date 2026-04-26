import axios from 'axios';

const CENTRAL_LOG_URL = process.env.CENTRAL_LOG_URL || 'http://api-gateway:3000/api/logs';
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';

class CentralLogClient {
  constructor() {
    this.serviceName = SERVICE_NAME;
  }

  async log(data) {
    const { level = 'info', action = 'other', message, metadata = {}, userId = null, traceId = null, ipAddress = null, userAgent = null } = data;

    try {
      await axios.post(CENTRAL_LOG_URL, {
        level,
        action,
        service: this.serviceName,
        message,
        metadata,
        userId,
        traceId,
        ipAddress,
        userAgent
      }, { timeout: 1000 });
    } catch (err) {
      console.error('Failed to send log to central:', err.message);
    }
  }

  // Auth actions
  login(message, metadata = {}, userId = null) {
    return this.log({ level: 'info', action: 'login', message, metadata, userId });
  }

  logout(message, metadata = {}, userId = null) {
    return this.log({ level: 'info', action: 'logout', message, metadata, userId });
  }

  register(message, metadata = {}, userId = null) {
    return this.log({ level: 'info', action: 'register', message, metadata, userId });
  }

  passwordChange(message, metadata = {}, userId = null) {
    return this.log({ level: 'info', action: 'password_change', message, metadata, userId });
  }

  // CRUD actions
  create(message, metadata = {}, userId = null) {
    return this.log({ level: 'info', action: 'create', message, metadata, userId });
  }

  update(message, metadata = {}, userId = null) {
    return this.log({ level: 'info', action: 'update', message, metadata, userId });
  }

  delete(message, metadata = {}, userId = null) {
    return this.log({ level: 'warning', action: 'delete', message, metadata, userId });
  }

  view(message, metadata = {}, userId = null) {
    return this.log({ level: 'debug', action: 'view', message, metadata, userId });
  }

  // Generic
  info(message, metadata = {}, userId = null) {
    return this.log({ level: 'info', action: 'other', message, metadata, userId });
  }

  warn(message, metadata = {}, userId = null) {
    return this.log({ level: 'warning', action: 'other', message, metadata, userId });
  }

  error(message, metadata = {}, userId = null) {
    return this.log({ level: 'error', action: 'error', message, metadata, userId });
  }

  critical(message, metadata = {}, userId = null) {
    return this.log({ level: 'critical', action: 'security', message, metadata, userId });
  }

  security(message, metadata = {}, userId = null) {
    return this.log({ level: 'warning', action: 'security', message, metadata, userId });
  }

  apiCall(message, metadata = {}, userId = null) {
    return this.log({ level: 'debug', action: 'api_call', message, metadata, userId });
  }
}

export default new CentralLogClient();
