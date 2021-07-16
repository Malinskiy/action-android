import { exec } from '@actions/exec'
import { ExecOptions } from '@actions/exec/lib/interfaces'

export default async function execWithResult(commandLine: string, args?: string[], options?: ExecOptions): Promise<Result> {
  let result: Result = new Result()
  let exitCode = await exec(commandLine, args, {
    ...options,
    listeners: {
      stdout: (data: Buffer) => {
        result.stdout += data.toString()
      },
      stderr: (data: Buffer) => {
        result.stderr += data.toString()
      }
    }
  })
  result.stdout = result.stdout.trim()
  result.stderr = result.stderr.trim()
  result.exitCode = exitCode

  return result
}

export async function execIgnoreFailure(commandLine: string, args?: string[], options?: ExecOptions): Promise<string> {
  let result = await execWithResult(commandLine, args, options);
  return result.stdout
}

export class Result {
  exitCode: number = 0;
  stdout: string = '';
  stderr: string = '';
}
