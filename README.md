# action-android 

This is a collection of GitHub Actions for Android development

# Requirements

This is only tested with **macOS-10.15** environment. It might work on linux but there is no support for kvm there so don't expect to have api 26+ available there.

## Android SDK
This repo provides an action for installing the Android SDK on the build agent. It will override whatever setup is 
already there. You might want to do this since default GitHub Actions environments are now missing `sdkmanager` binary
so they're immutable.

### Usage

```yaml
steps:
  - uses: actions/checkout@v1
  - uses: malinskiy/action-android/install-sdk@release/0.0.6
  - run: adb devices
  - run: echo $ANDROID_HOME
```

## Building your code
There is an official [action](https://github.com/actions/setup-java) for Java setup. For execution using Gradle 
I suggest to use `./gradlew` to minimize the dependency on environment setup.

## Testing against Android Emulator
`action-android/emulator-run-cmd` provide an action which installs the emulator packages, starts the emulator and waits
until it's booted. After this it will execute the provided cmd and stop the running emulator.

It's imperative(!) to use `runs-on: macOS-10.15` if you want to have hardware acceleration for your emulator.

### Usage

```yaml
steps:
  - uses: actions/checkout@v1
  - uses: malinskiy/action-android/emulator-run-cmd@release/0.0.6
  
    with:
      cmd: ./gradlew integrationTest
      api: 25
      tag: default
      abi: x86
```

- `cmd` is the shell command to execute while the emulator is booted
- `api` is the API version of emulator
- `tag` is either the **default** or **google_apis**. Use google_apis for emulator with google store
- `abi` is the abi of the emulator. x86 is the fastest one
- `hardwareProfile` is the hardware profile of the emulator. Check the `avdmanager list` for supported value. I advise to use string names instead of ids since those might change between sdk updates
- `cmdOptions` is value which you can use to pass additional arguments to the emulator start command. By default this is `-no-snapshot-save -noaudio -no-boot-anim`
- `disableAnimations` to disable animations using the system preferences. `false` by default. Keep in mind that applications might not respect system settings and these might have no effect at all 
- `verbose` if you want to enable additional logging for this action

### Artifacts
The `emulator-run-cmd` action will generate an `artifacts/logcat.log` artifact that you can use in your builds to investigate issues. For example the next snippet will save the artifact in case the previous steps had failures (your tests failed and you need these logs for investigation).

```yaml
- name: Save logcat output
  uses: actions/upload-artifact@master
  if: failure()
  with:
    name: logcat
    path: artifacts/logcat.log
```

### Info about emulator-start and emulator-stop actions
Currently GitHub Actions do not support OS processes that outlive the specific step hence you can't really do a 
workflow that starts the emulator and then execute your testing command in a separate step. This is the reason why
I've written the combined `emulator-run-cmd` action. If you have multiple commands to run in parallel to emulator I suggest to write a script and execute it via the cmd arg.

# License

```
MIT License

Copyright (c) 2019 Anton Malinskiy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Android SDK
By using this action you're automatically accepting the relevant licenses of Android SDK. See the Android SDK for more details.
