// @flow
/**
 * A simple promisified version of child_process.exec, so we can `await` it
 */
const { spawn } = require("child_process");

const execProm = (
  command /*: string*/,
  { rejectOnError, ...options } /*: {rejectOnError: boolean} & mixed */ = {}
) /*: Promise<{err: ?number, stdout: string, stderr: string}>*/ =>
  new Promise((res, rej) => {
    const proc = spawn(
      command,
      // $FlowFixMe
      { ...options, shell: true }
    );
    let stdout = "";
    let stderr = "";
    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");
    proc.stdout.on("data", (data /*: string*/) => (stdout += data));
    proc.stderr.on("data", (data /*: string*/) => (stderr += data));
    proc.on("close", (code /*: number*/) => {
      if (code !== 0 && rejectOnError) {
        rej(new Error(`Exited with non-zero error code: ${code}`));
      } else {
        res({
          err: code === 0 ? null : code,
          stdout,
          stderr,
        });
      }
    });
  });

module.exports = execProm;
