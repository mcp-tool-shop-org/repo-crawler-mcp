import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GitHubAdapter } from './adapters/github.js';
import { registerCrawlRepoTool } from './tools/crawlRepo.js';
import { registerCrawlOrgTool } from './tools/crawlOrg.js';
import { registerRepoSummaryTool } from './tools/repoSummary.js';
import { registerCompareReposTool } from './tools/compareRepos.js';
import { registerExportDataTool } from './tools/exportData.js';
import { log } from './utils/logger.js';

const SERVER_NAME = 'repo-crawler-mcp';
const SERVER_VERSION = '0.1.0';

export function createServer(): McpServer {
  const adapter = new GitHubAdapter();

  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  registerCrawlRepoTool(server, adapter);
  registerCrawlOrgTool(server, adapter);
  registerRepoSummaryTool(server, adapter);
  registerCompareReposTool(server, adapter);
  registerExportDataTool(server);

  return server;
}

export async function startServer(): Promise<void> {
  const hasToken = !!process.env.GITHUB_TOKEN;
  log.info(`${SERVER_NAME} v${SERVER_VERSION}`);
  log.info(`Auth: ${hasToken ? 'Token provided (5,000 req/hr)' : 'No token (60 req/hr — set GITHUB_TOKEN for higher limits)'}`);

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info('Server connected and ready');
}
