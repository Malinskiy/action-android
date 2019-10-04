import { exec } from '@actions/exec'
import { ExecOptions } from '@actions/exec/lib/interfaces'

export default async function execWithResult(commandLine: string, args?: string[], options?: ExecOptions): Promise<string> {
  let result: string = ''
  await exec(commandLine, args, {
    ...options,
    listeners: {
      stdout: (data: Buffer) => {
        result += data.toString()
      }
    }
  })
  return result.trim()
}
