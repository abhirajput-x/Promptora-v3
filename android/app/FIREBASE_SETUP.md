# Firebase setup (placeholder)

This project ships with `google-services.json.example` as a placeholder only.
Firebase is **not wired up yet** — no Firebase SDK dependency has been added
to `android/app/build.gradle`, and the placeholder file is intentionally named
`.example` so the Google Services Gradle plugin (already present in
`android/build.gradle` and applied conditionally in `android/app/build.gradle`)
does not try to parse fake data.

## To enable Firebase later

1. Create/open your project at https://console.firebase.google.com
2. Add an Android app with package name: `com.promptora.app`
3. Download the real `google-services.json`
4. Replace this folder's `google-services.json.example` file: save the
   downloaded file as `android/app/google-services.json` (drop the
   `.example` suffix)
5. Add the Firebase SDK dependencies you need to `android/app/build.gradle`,
   e.g. for push notifications:
   ```gradle
   implementation platform('com.google.firebase:firebase-bom:33.1.0')
   implementation 'com.google.firebase:firebase-messaging'
   ```
6. Re-run `npx cap sync android` and rebuild.

The `android/app/build.gradle` file already contains this guard so nothing
breaks until you do the above:

```gradle
try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```
