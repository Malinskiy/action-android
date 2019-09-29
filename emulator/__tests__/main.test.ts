import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
    process.env['INPUT_ABI'] = 'x86';
    process.env['INPUT_API'] = '25';
    process.env['INPUT_TAG'] = 'default';
    const ip = path.join(__dirname, '..', 'lib', 'main.js');
    console.log(cp.execSync(`node ${ip}`).toString());
})
