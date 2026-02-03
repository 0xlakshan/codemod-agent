<p align="center">
 <h1 align="center"><b>Codemod Agent</b></h1>
<p align="center">
  Automated code changes for fast moving teams
</p>
<br/>
</p>

This GitHub App applies codemods to your pull requests. Simply comment `/codemod <codemod-name>` on any PR, and the bot will apply the transformation to all changed files with a summary comment listing all modified files. Choose from hundreds of popular codemods in the registry at <https://app.codemod.com/registry>.

### How to use

1. Install the GitHub App on your repository
2. Comment: `/codemod <codemod-name>`
3. The bot will apply the codemod and commit the changes

Example:

`/codemod react/19/replace-use-form-state`

### Codemod Guides

- Registry: <https://app.codemod.com/registry>
- Publish your own: <https://codemod.mintlify.app/publishing>
