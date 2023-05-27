// Creates a .npmrc file on the root of the project that sets
// the required shell for npm script.
// NPM scripts will rely on bash to work properly. 

const fs = require('fs');
const { execSync } = require('child_process');

// Default shell in unix systems
let shell = '/bin/bash';

if (process.platform === 'win32') {
  const command = 'where.exe bash';
  const out = Buffer.from(execSync(command)).toString('utf-8');

  // Ensure we find the gitbash shell and not wsl
  const shellpath = out
    .split('\r\n')
    .filter(path => path.toLowerCase().indexOf('git') > -1);

  if (!shellpath[0]) {
    console.error('Unable to find bash in system!');
    return process.exit(1);
  }
  shell = shellpath[0];
}

console.log('Setting script-shell to:', shell);

fs.writeFileSync('.npmrc', `script-shell=${shell}`);

console.log('Shell is configured correctly!');
