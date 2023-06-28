import { Octokit } from "octokit";
import { execSync } from "child_process";
import Koa from "koa";

const octokit = new Octokit({
    auth:""
});

async function downloadArtifact(run_id){
    const res = await octokit.request("GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts", {
        owner: "zvms",
        repo: "zvms",
        run_id,
    });
    if(res.status !== 200){
        throw new Error("Failed to get artifacts");
    }
    const artifactUrl = res.data.artifacts[0].archive_download_url;

    // save artifact to disk
    execSync(`wget ${artifactUrl} -O ./temp/artifact.zip`);

    // unzip artifact to /www/zhzx.top/dist in centos
    execSync(`unzip -o ./temp/artifact.zip -d /www/zhzx.top/dist`);
}

async function reloadNginx(){
    execSync(`nginx -s reload`);
}

const app = new Koa();
app.use(async ctx => {
    // on GitHub webhook workflow_run.completed
    // download artifact and reload nginx
    if(ctx.request.headers["X-GitHub-Event"] === "workflow_run"){
        const run_id = ctx.request.body.workflow_run.id;
        await downloadArtifact(run_id);
        await reloadNginx();
    }
});

app.listen(8887);