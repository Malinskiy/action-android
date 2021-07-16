import execWithResult, {execIgnoreFailure, Result} from "./exec-with-result";
import * as core from "@actions/core";

export class Marathon {
    private url: string;

    public constructor(url: string) {
        this.url = url;
    }

    async install(): Promise<Boolean> {
        //Remove previous installation if the agent is long-lived
        await execIgnoreFailure(`rm -r /tmp/marathon || true`)
        await execIgnoreFailure(`curl -L -o /tmp/marathon.zip ${this.url}`)
        await execIgnoreFailure(`unzip /tmp/marathon.zip -d /tmp/`)
        await execIgnoreFailure(`mv /tmp/marathon-* /tmp/marathon`)

        const PATH = process.env.PATH!!
        let extraPaths = `/tmp/marathon/bin`
        core.exportVariable('PATH', `${extraPaths}:${PATH}`)

        console.log(`Marathon installed:`)
        console.log(await execIgnoreFailure(`marathon --help`))
        return true
    }

    async run(marathonfile: string): Promise<Result> {
        let args = ""
        if(marathonfile === "") {
            args = ""
        } else {
            args = ` -m ${marathonfile}`
        }
        return await execWithResult(`/tmp/marathon/bin/marathon${args}`);
    }
}
