class TokenBlacklistService {
  constructor() {
    /** @type {Map<string, number>} token or jti -> expiration timestamp in ms */
    this.revokedTokens = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 30 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  revoke(token, expSeconds = null) {
    if (!token) return;
    const expMs = expSeconds ? expSeconds * 1000 : Date.now() + 24 * 60 * 60 * 1000;
    this.revokedTokens.set(token, expMs);
  }

  isRevoked(token) {
    if (!token) return false;
    const expMs = this.revokedTokens.get(token);
    if (!expMs) return false;

    if (Date.now() > expMs) {
      this.revokedTokens.delete(token);
      return false;
    }
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [token, expMs] of this.revokedTokens.entries()) {
      if (now > expMs) {
        this.revokedTokens.delete(token);
      }
    }
  }

  clear() {
    this.revokedTokens.clear();
  }
}

module.exports = new TokenBlacklistService();
