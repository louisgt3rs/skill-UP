const { View } = require('react-native');

module.exports = {
  Screen: View,
  ScreenContainer: View,
  ScreenStack: View,
  ScreenStackHeaderConfig: View,
  ScreenStackHeaderBackButtonImage: View,
  ScreenStackHeaderRightView: View,
  ScreenStackHeaderLeftView: View,
  ScreenStackHeaderCenterView: View,
  ScreenStackHeaderConfig: View,
  NativeScreen: View,
  NativeScreenContainer: View,
  enableScreens: function() {},
  screensEnabled: function() { return false; },
  useTransitionProgress: function() { return {}; },
  useReanimatedTransitionProgress: function() { return {}; },
};
