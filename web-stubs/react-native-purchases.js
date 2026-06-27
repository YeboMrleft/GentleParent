// Web stub for react-native-purchases (RevenueCat has no web SDK).
// On the web app, in-app purchases are no-ops — premium upgrades happen in the
// native Android app. Metro aliases this file for `platform === 'web'`
// (see metro.config.js). Keeps the web bundle from pulling native RevenueCat code.

const noCustomerInfo = {
  entitlements: { active: {}, all: {} },
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
  latestExpirationDate: null,
  originalAppUserId: 'web-anonymous',
  managementURL: null,
};

const Purchases = {
  PACKAGE_TYPE: { UNKNOWN: 'UNKNOWN', CUSTOM: 'CUSTOM', LIFETIME: 'LIFETIME', ANNUAL: 'ANNUAL', MONTHLY: 'MONTHLY', WEEKLY: 'WEEKLY' },
  PACKAGE: { MONTHLY: 'MONTHLY', ANNUAL: 'ANNUAL', LIFETIME: 'LIFETIME' },
  LOG_LEVEL: { VERBOSE: 'VERBOSE', DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' },
  configure() {},
  setLogLevel() {},
  async getCustomerInfo() { return noCustomerInfo; },
  async getOfferings() { return { current: null, all: {} }; },
  async purchasePackage() {
    throw new Error('Purchases are only available in the Android app. Open Gentle Parent on your phone to upgrade.');
  },
  async restorePurchases() { return noCustomerInfo; },
  addCustomerInfoUpdateListener() {},
  removeCustomerInfoUpdateListener() {},
  async logIn() { return { customerInfo: noCustomerInfo, created: false }; },
  async logOut() { return noCustomerInfo; },
};

module.exports = Purchases;
module.exports.default = Purchases;
module.exports.__esModule = true;
