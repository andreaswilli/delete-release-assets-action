const fs = require("fs");
const core = require("@actions/core");
const github = require("@actions/github");
const { Octokit } = require("@octokit/rest");

try {
  main();
} catch (e) {
  core.setFailed(e.message);
}

async function main() {
  const tag = core.getInput("tag") || (await getVersionFromPackageJson());
  const githubToken = core.getInput("github_token");
  const { repo, owner } = github.context.repo;

  if (!tag) {
    core.setFailed(
      "Missing value for 'tag'. Was not specified and failed to read from package.json"
    );
  }

  if (!githubToken) {
    core.setFailed(
      "GitHub Access Token was not specified but is required for this action!"
    );
  }

  const octokit = new Octokit({ auth: githubToken });

  core.info("Getting releases...");
  const { data: releases } = await octokit.request(
    `GET /repos/{owner}/{repo}/releases`,
    { owner, repo }
  );
  const release = releases.find((r) => r.tag_name === `v${tag}`);

  if (!release) {
    core.setFailed(`No release for tag v${tag} found.`);
  }
  core.info(`Release ${release.tag_name} found.`);

  if (!release.draft) {
    core.notice(
      `Not deleting assets because ${release.tag_name} is not a draft.`
    );
    return;
  }

  core.info(`Found ${release.assets.length} assets.`);

  await Promise.all(
    release.assets.map((a) => {
      core.info(`Deleting ${a.name}`);
      return octokit.request(
        "DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}",
        { owner, repo, asset_id: a.id }
      );
    })
  );

  core.info("Successfully deleted assets!");
}

function getVersionFromPackageJson() {
  core.info("Input 'tag' not specified. Reading version from package.json");

  return new Promise((res) => {
    fs.readFile("./package.json", (err, data) => {
      if (err) core.setFailed(err);
      else res(data);
    });
  });
}
