const path = require("path");

module.exports = {
  assets: ["./src/assets/fonts"],
  dependencies: {
    "react-native-config": {
      root: path.join(__dirname, "node_modules/react-native-config"),
      platforms: {
        android: {
          sourceDir: path.join(__dirname, "node_modules/react-native-config/android"),
          packageImportPath: "import com.lugg.RNCConfig.RNCConfigPackage;",
          packageInstance: "new RNCConfigPackage()",
          // Preserve the library's New Architecture codegen metadata. The explicit
          // package override predates TurboModules and otherwise strips these
          // fields from the autolinking manifest.
          libraryName: "RNCConfigSpec",
          componentDescriptors: [],
          cmakeListsPath: path.join(
            __dirname,
            "node_modules/react-native-config/android/build/generated/source/codegen/jni/CMakeLists.txt"
          ),
        },
      },
    },
    "@react-native-community/datetimepicker": {
      platforms: {
        android: {
          sourceDir: path.join(
            __dirname,
            "node_modules/@react-native-community/datetimepicker/android"
          ),
          packageImportPath:
            "import com.reactcommunity.rndatetimepicker.RNDateTimePickerPackage;",
          packageInstance: "new RNDateTimePickerPackage()",
        },
      },
    },
  },
};
