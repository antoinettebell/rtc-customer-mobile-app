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
