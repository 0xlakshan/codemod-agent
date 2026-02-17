<p align="center">
 <h1 align="center"><b>Codemod Agent</b></h1>
<p align="center">
  Automated code changes for fast moving teams
</p>
</p>

<p align="center">
  <a href="https://deepwiki.com/0xlakshan/codemod-agent">
    <img src="https://img.shields.io/badge/DeepWiki-0xlakshan%2Fcodemod--agent-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==" />
  </a>
</p>

<br/>

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

### Self Hosting Guide

Run your own instance of Codemod Agent:

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/<your-username>/codemod-agent.git
   cd codemod-agent
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Create a GitHub App**
   - Go to GitHub Settings → Developer settings → GitHub Apps → New GitHub App
   - Set Webhook URL (use [smee.io](https://smee.io) for local development)
   - Required permissions:
     - Repository permissions: Contents (Read & Write), Pull requests (Read & Write), Issues (Read & Write)
   - Subscribe to events: Issue comment, Pull request
   - Generate and download a private key

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   APP_ID="<your-github-app-id>"
   WEBHOOK_SECRET="<your-webhook-secret>"
   PRIVATE_KEY_PATH="<path-to-private-key.pem>"
   PORT="3000"
   NODE_ENV="development"
   ```

5. **Build and run**

   ```bash
   pnpm build
   node dist/index.js
   ```

6. **Install the app on your repositories**
   - Go to your GitHub App settings
   - Install the app on repositories where you want to use it
