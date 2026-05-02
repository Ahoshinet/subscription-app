export const GOOGLE_IOS_CLIENT_ID = '171480425592-epcnn61pcg7ncgn5oeslt85isbp1e3f5.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = '171480425592-armg3k0lig1an3v464s7p9sduipric83.apps.googleusercontent.com';
export const GOOGLE_WEB_CLIENT_ID = '171480425592-5mutdd96kl48lf66aav9mp02fpgj41c2.apps.googleusercontent.com';

// Dev: Expo auth proxy. Register in Google Console → Web client → Authorized redirect URIs.
export const GOOGLE_DEV_REDIRECT_URI = 'https://auth.expo.io/@darui3018823/subscription-app';

// Production iOS: reverse client ID scheme, pre-approved by Google for iOS OAuth clients.
// No manual registration needed in Google Console.
export const GOOGLE_IOS_REDIRECT_URI = 'com.googleusercontent.apps.171480425592-epcnn61pcg7ncgn5oeslt85isbp1e3f5:/oauth2redirect';
