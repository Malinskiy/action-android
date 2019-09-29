import * as core from '@actions/core';

async function run() {
  try {
    const api = core.getInput('api');
    const abi = core.getInput('abi');
    console.log(`Starting emulator with API=${api} and ABI=${abi}...`)
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
