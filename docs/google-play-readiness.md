# Google Play release readiness

## Android build baseline

- Android package: `com.playmate.app` (confirm that this is the final package before the first Play upload; it cannot be changed after publication).
- Expo SDK 58 targets Android API 36 by default, matching the current new-app requirement. Keep Expo and its Android tooling current and verify the built AAB in Play Console before each release.
- Mobile version: `0.1.0`; Android version code starts at `1`. EAS production builds increment the version code automatically.
- The production profile builds an Android App Bundle. EAS signing keys and Play service-account credentials must be created in the publisher’s accounts and kept out of Git.

## Required account and hosting setup

1. Deploy the API and database to production. Set `EXPO_PUBLIC_API_URL` to the public HTTPS API root in the EAS environment; never ship a localhost or LAN address.
2. Set production Supabase URL and anon key, Razorpay live/test keys as appropriate, webhook secret, and `PLAYMATE_SUPPORT_EMAIL`. Use EAS secrets for private values.
3. Deploy and verify these unauthenticated HTTPS pages on that API domain:
   - `/legal/privacy-policy`
   - `/legal/community-guidelines`
   - `/account-deletion`
4. Register/link the app with the publisher’s Expo account (`eas init`) to generate `extra.eas.projectId`. Create the Play service account, grant it Play Console access, download its JSON key to `apps/mobile/play-service-account-key.json`, and configure that file only on a trusted release machine. It is ignored by Git.
5. Upload the first AAB to internal testing, verify install/update, sign-in, location denial, booking checkout, account deletion, user reports, and venue-owner flows. Promote the same signed artifact through closed testing and production.

## Play Console declarations and listing

- Complete App access instructions with working reviewer credentials and any OTP instructions.
- Complete the Data safety form from actual production behavior, including account/contact data, location used for nearby search, profile and user-generated content, bookings and purchase activity, and data processed by Supabase, Razorpay, and Resend. Declare retention/deletion accurately. Review the current SDK inventory before submission.
- Add the live Privacy Policy URL and Account Deletion URL. Ensure both work without sign-in and are available worldwide over HTTPS. The in-app profile has links to the policy pages and an account deletion action.
- Declare whether ads are present (the current app has no ad SDK configured), the target audience, content rating, and financial features accurately. The app is a sports booking and physical sports-goods service; do not sell digital app features through Razorpay.
- Prepare the store title, short and full descriptions, support contact, category, 512 × 512 store icon, 1024 × 500 feature graphic, and phone screenshots. Screenshots must show the real shipped app and avoid claims for unfinished features.
- Ensure the app is not listed as directed to children. If the target audience includes children, update the app and disclosures for Google Play Families requirements and applicable child privacy laws before release.
- Keep user-generated game posts and group messages behind explicit acceptance of the current community guidelines. Keep in-app report and block controls available, and staff the moderation queue with a documented response process.
- For personal Play Console accounts created after November 13, 2023, satisfy the current closed-test requirement before applying for production access.

## Open release gates

- Set a real support/privacy contact in `PLAYMATE_SUPPORT_EMAIL` and verify it is monitored.
- Deploy the API so the legal and deletion links have permanent public HTTPS URLs; enter those exact URLs in Play Console.
- Complete the Play Console declarations, store assets, reviewer access, developer/device verification, testing track, and production access steps. These account-owned steps cannot be completed from the repository.
- Run a release build on a physical Android device and complete Play Console pre-launch report review. A local TypeScript build is not a substitute for testing the signed AAB.

## Policy references

- [Target API level requirements](https://developer.android.com/google/play/requirements/target-sdk)
- [User-generated content policy](https://support.google.com/googleplay/android-developer/answer/9876937)
- [Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Payments policy](https://support.google.com/googleplay/android-developer/answer/10281818)
- [Testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
