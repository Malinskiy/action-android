import * as core from '@actions/core';
import * as exec from '@actions/exec'

async function run() {
  try {
    const api = core.getInput('api');
    const abi = core.getInput('abi');

    let tag = core.getInput('tag')
    if (tag !== "default" && tag !== "google_apis") {
      console.log(`Unknown tag ${tag}. Using default`)
      tag = 'default'
    }

    console.log(`Starting emulator with API=${api}, TAG=${tag} and ABI=${abi}...`)

    const androidHome = process.env.ANDROID_HOME
    console.log(`ANDROID_HOME is ${androidHome}`)

    await exec.exec(`${androidHome}/tools/bin/sdkmanager "system-images;android-${api};${tag};${abi}" --verbose`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
