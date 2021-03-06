const fs = require("fs");
const core = require("@actions/core");
const github = require("@actions/github");
const { Octokit } = require("@octokit/rest");

main().catch((e) => core.setFailed(e.message));

async function main() {
  const tag = core.getInput("tag") || (await getVersionFromPackageJson());
  const tagPrefix = core.getInput("tagPrefix");
  const deleteOnlyFromDrafts = core.getInput("deleteOnlyFromDrafts");
  const githubToken = core.getInput("github_token");
  const { repo, owner } = github.context.repo;

  if (!tag) {
    throw new Error(
      "Missing value for 'tag'. Was not specified and failed to read from package.json"
    );
  }

  if (!githubToken) {
    throw new Error(
      "GitHub Access Token was not specified but is required for this action!"
    );
  }

  const octokit = new Octokit({ auth: githubToken });

  core.info("Getting releases...");
  const { data: releases } = await octokit.request(
    `GET /repos/{owner}/{repo}/releases`,
    { owner, repo }
  );
  const release = releases.find((r) => r.tag_name === `${tagPrefix}${tag}`);

  if (!release) {
    core.notice(`No release for tag ${tagPrefix}${tag} found.`);
    return;
  }
  core.info(`Release ${release.tag_name} found.`);

  if (deleteOnlyFromDrafts === "true" && !release.draft) {
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

  core.info("Done.");
}

function getVersionFromPackageJson() {
  core.info("Input 'tag' not specified. Reading version from package.json");

  return new Promise((res) => {
    fs.readFile("./package.json", "utf-8", (err, data) => {
      if (err) throw new Error(err.message);
      else res(JSON.parse(data).version);
    });
  });
}
