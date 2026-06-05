import * as core from '@actions/core';
import * as github from '@actions/github';
import { getDiffTokens } from './diff';

async function run() {
  try {
    const token = core.getInput('github-token');
    const maxTokens = parseInt(core.getInput('max-tokens') || '10000', 10);
    const octokit = github.getOctokit(token);
    
    const context = github.context;
    
    let baseSha: string | undefined;
    if (context.payload.pull_request) {
      baseSha = context.payload.pull_request.base.sha;
    } else if (context.eventName === 'push') {
      baseSha = context.payload.before;
    }
    
    const root = process.env.GITHUB_WORKSPACE || process.cwd();
    
    core.info(`Running fitcheck diff against base SHA: ${baseSha || 'HEAD'}`);
    const diffResult = getDiffTokens(root, baseSha);
    
    if (diffResult.netDelta > maxTokens) {
      if (context.payload.pull_request) {
        const prNumber = context.payload.pull_request.number;
        const owner = context.repo.owner;
        const repo = context.repo.repo;
        
        const body = `⚠️ **Fitcheck Warning: High Token Bloat**\n\n` +
          `This PR adds **${diffResult.tokensAdded.toLocaleString()}** tokens and removes **${diffResult.tokensRemoved.toLocaleString()}** tokens. ` +
          `The net increase is **${diffResult.netDelta.toLocaleString()} tokens**, which exceeds your warning limit of ${maxTokens.toLocaleString()}.\n\n` +
          `Consider running \`fitcheck init\` locally to ensure you aren't committing unnecessary files (like lockfiles or build artifacts) to your AI context window.`;
          
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body
        });
        core.info('Posted warning comment to PR.');
      }
      core.warning(`Fitcheck token delta (${diffResult.netDelta}) exceeds limit (${maxTokens}).`);
    } else {
      core.info(`Fitcheck delta (${diffResult.netDelta}) is within the limit (${maxTokens}).`);
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
