import 'dotenv/config';

// Expo supports a JS config file which allows us to read from process.env at
// build time and expose values through Constants.expoConfig.extra.  This is the
// recommended pattern for including environment variables in managed Expo apps.
//
// See https://docs.expo.dev/workflow/configuration/#dynamic-configuration

export default ({ config }) => ({
  // config IS the expo config object (unwrapped) — spread it directly so
  // android, ios, plugins, etc. are preserved for prebuild.
  ...config,
  extra: {
    // Preserve static extra fields from app.json (e.g. eas.projectId)
    ...config.extra,
    API_URL: process.env.API_URL || '',
    API_PORT: process.env.API_PORT || '',
  },
});
