// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

const cli = require('commander');

const { version } = require('../../package.json');

/**
 * Process.argv arguments length is different in electron mode and in packaged
 * mode. This small line is to harmonize the behavior for consistent parsing.
 *
 * @see https://github.com/tj/commander.js/issues/512
 * @see https://github.com/electron/electron/issues/4690#issuecomment-217435222
 */
if (process.defaultApp !== true) {
  process.argv.unshift(null);
}

cli
  .version(version)
  .allowUnknownOption()
  .option(
    '--no-run-parity',
    'Parity UI will not attempt to run the locally installed parity.'
  )
  .option(
    '--ui-dev',
    'The Light Wallet will load http://localhost:3000. WARNING: Only use this is you plan on developing on Parity UI.'
  )
  .option(
    '--ws-interface',
    "Specify the hostname portion of the WebSockets server Parity UI will connect to. IP should be an interface's IP address. (default: 127.0.0.1)"
  )
  .option(
    '--ws-port',
    'Specify the port portion of the WebSockets server Parity UI will connect to. (default: 8546)'
  )
  .parse(process.argv);

/**
 * Camel-case the given `flag`
 *
 * @param {String} flag
 * @return {String}
 * @see https://github.com/tj/commander.js/blob/dcddf698c5463795401ad3d6382f5ec5ec060478/index.js#L1160-L1172
 */
const camelcase = flag =>
  flag
    .split('-')
    .reduce((str, word) => str + word[0].toUpperCase() + word.slice(1));

// Now we must think which arguments passed to cli must be passed down to
// parity.
const parityArgv = cli.rawArgs
  .splice(Math.max(cli.rawArgs.findIndex(item => item.startsWith('--'))), 0) // Remove all arguments until one --option
  .filter((item, index, array) => {
    const key = camelcase(item.replace('--', '').replace('no-', '')); // Remove first 2 '--' and then camelCase

    if (key in cli) {
      // If the option is consumed by commander.js, then we skip it
      return false;
    }

    // If it's not consumed by commander.js, and starts with '--', then we keep
    // it. This step is optional, used for optimization only.
    if (item.startsWith('--')) {
      return true;
    }

    const previousKey = camelcase(array[index - 1].replace('--', '').replace('no-', ''));

    if (cli[previousKey] === item) {
      // If it's an argument of an option consumed by commander.js, then we
      // skip it too
      return false;
    }

    return true;
  });

module.exports = { cli, parityArgv };
