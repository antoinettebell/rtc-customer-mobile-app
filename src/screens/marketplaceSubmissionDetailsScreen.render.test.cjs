const assert = require('assert');
const fs = require('fs');
const Module = require('module');
const path = require('path');
const babel = require('@babel/core');

const screenPath = path.join(__dirname, 'marketplaceSubmissionDetailsScreen.js');
const actionHelperPath = path.join(
  __dirname,
  '../helpers/marketplaceCoordinatorSubmissionActions.helper.js'
);
const originalLoad = Module._load;

const compileModule = (filename, mocks = {}) => {
  const source = fs.readFileSync(filename, 'utf8');
  const transformed = babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    presets: [['@babel/preset-react', { runtime: 'classic' }]],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const compiledModule = new Module(filename, module);
  compiledModule.filename = filename;
  compiledModule.paths = Module._nodeModulePaths(path.dirname(filename));
  Module._load = (request, parent, isMain) => {
    if (parent?.filename === filename && Object.prototype.hasOwnProperty.call(mocks, request)) {
      return mocks[request];
    }
    return originalLoad(request, parent, isMain);
  };
  try {
    compiledModule._compile(transformed, filename);
    return compiledModule.exports;
  } finally {
    Module._load = originalLoad;
  }
};

const actions = compileModule(actionHelperPath);
const createElement = (type, props, ...children) => ({
  type,
  props: { ...(props || {}), children },
});
const ReactMock = { createElement };
const primitive = (name) => name;
const apiMock = new Proxy({}, { get: () => async () => ({ success: true }) });
const styleProxy = new Proxy({}, { get: () => ({}) });

const screen = compileModule(screenPath, {
  react: {
    __esModule: true,
    default: ReactMock,
    useState: (initial) => [initial, () => undefined],
  },
  'react-native': {
    Alert: { alert: () => undefined },
    Image: primitive('Image'),
    Linking: { openURL: () => undefined },
    ScrollView: primitive('ScrollView'),
    Text: primitive('Text'),
    TextInput: primitive('TextInput'),
    TouchableOpacity: primitive('TouchableOpacity'),
    View: primitive('View'),
  },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0 }) },
  'react-native-vector-icons/MaterialIcons': { __esModule: true, default: primitive('Icon') },
  '../components/AppHeader': { __esModule: true, default: primitive('AppHeader') },
  '../components/StatusBarManager': { __esModule: true, default: primitive('StatusBarManager') },
  '../utils/theme': { AppColor: {} },
  '../apiFolder/appAPI': apiMock,
  '../helpers/marketplaceCoordinatorSubmissionActions.helper': actions,
  './marketplaceShared': {
    formatMoney: (value) => String(value ?? ''),
    getMarketplaceMessageError: () => null,
    styles: styleProxy,
  },
  '../components/ZoomableImageModal': { __esModule: true, default: primitive('ZoomableImageModal') },
});

const collectText = (node, output = []) => {
  if (node == null || typeof node === 'boolean') return output;
  if (typeof node === 'string' || typeof node === 'number') {
    output.push(String(node));
    return output;
  }
  if (Array.isArray(node)) {
    node.forEach((child) => collectText(child, output));
    return output;
  }
  if (typeof node.type === 'function') {
    collectText(node.type(node.props || {}), output);
    return output;
  }
  const children = node.props?.children || [];
  collectText(children, output);
  return output;
};

const render = (submission, submissionType) => {
  const tree = screen.default({
    navigation: { canGoBack: () => true, goBack: () => undefined, navigate: () => undefined },
    route: { params: { submission, submissionType } },
  });
  return collectText(tree).join(' ');
};

for (const testCase of [
  {
    submissionType: 'Bid',
    submission: { bid_id: 'bid-1', event_id: 'event-1', bid_status: 'SUBMITTED' },
    label: 'Reject Bid',
    status: 'SUBMITTED',
  },
  {
    submissionType: 'Application',
    submission: {
      application_id: 'food-application-1',
      event_id: 'event-1',
      application_status: 'UNDER_REVIEW',
    },
    label: 'Reject Application',
    status: 'UNDER_REVIEW',
  },
  {
    submissionType: 'Marketplace Vendor Application',
    submission: {
      application_id: 'event-vendor-application-1',
      event_id: 'event-1',
      profile_id: 'profile-1',
      vendor_types: ['MERCHANDISE'],
      offering_bullets: ['Handmade goods'],
      status: 'SUBMITTED',
    },
    label: 'Reject Application',
    status: 'SUBMITTED',
  },
]) {
  const renderedText = render(testCase.submission, testCase.submissionType);
  assert.match(renderedText, new RegExp(testCase.label));
  assert.match(renderedText, new RegExp(testCase.status));
}

const combinedBidText = render({
  bid_id: 'bid-combined',
  event_id: 'event-1',
  bid_status: 'SUBMITTED',
  full_bid_amount: 1250,
  specialty_services: ['DESSERTS', 'DRINKS'],
  dessert_bid_amount: 150,
  dessert_price_per_guest: 3,
  drinks_bid_amount: 100,
  drinks_price_per_guest: 2,
}, 'Bid');
assert.match(combinedBidText, /Desserts Bid Amount/);
assert.match(combinedBidText, /Drinks Bid Amount/);
assert.match(combinedBidText, /Total Bid Amount/);
assert.match(combinedBidText, /1500/);

console.log('marketplace submission details render tests passed');
