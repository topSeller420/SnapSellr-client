import 'dotenv/config';

// Expo supports a JS config file which allows us to read from process.env at
// build time and expose values through Constants.expoConfig.extra.  This is the
// recommended pattern for including environment variables in managed Expo apps.
//
// See https://docs.expo.dev/workflow/configuration/#dynamic-configuration

export default ({ config }) => {
  // choose an .env file based on NODE_ENV if you want, or just load whatever
  // dotenv-cli placed in process.env when running the start script
  return {
    ...config,
    expo: {
      ...config.expo,
      extra: {
        API_URL: process.env.API_URL || '',
        API_PORT: process.env.API_PORT || '',
        // add any other variables you need here
      },
      "plugins": [
        "expo-font",
        "expo-image",
        "expo-router",
        "expo-web-browser"
      ]
    },
  };
};
