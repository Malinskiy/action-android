import * as core from '@actions/core';
import execWithResult from './exec-with-result'

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
    console.log(`PATH is ${process.env.PATH}`)

    let output = execWithResult(`${androidHome}/tools/bin/sdkmanager "system-images;android-${api};${tag};${abi}" --verbose`);
    console.log(`${output}`)
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
