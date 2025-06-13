/**
 * Direct execution for Advanced Memory Bank MCP
 */

import { MemoryManager } from '../core/memory-manager.js';
import { initializeDatabase } from '../database/initialize.js';

/**
 * Main entry point for direct execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Advanced Memory Bank MCP');
    console.log('Usage:');
    console.log('  node run.js init - Initialize database');
    console.log('  node run.js list - List all projects');
    console.log('  node run.js files [project] - List files in project');
    console.log('  node run.js read [project] [file] - Read a file');
    console.log('  node run.js search [project] "[query]" - Search project');
    console.log('  node run.js analyze [project] - Analyze project memory');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'init':
      console.log('Initializing database...');
      await initializeDatabase();
      console.log('Database initialized successfully');
      break;
      
    case 'list':
      const manager = new MemoryManager();
      const projects = await manager.listProjects();
      console.log('Projects:');
      projects.forEach(project => console.log(`- ${project}`));
      break;
      
    case 'files':
      if (args.length < 2) {
        console.error('Error: Missing project name');
        return;
      }
      
      const filesManager = new MemoryManager();
      const projectName = args[1];
      const files = await filesManager.listProjectMemories(projectName);
      console.log(`Files in project ${projectName}:`);
      files.forEach(file => console.log(`- ${file}.md`));
      break;
      
    case 'read':
      if (args.length < 3) {
        console.error('Error: Missing project name or file name');
        return;
      }
      
      const readManager = new MemoryManager();
      const readProject = args[1];
      const fileName = args[2];
      
      try {
        const content = await readManager.readMemory(readProject, fileName);
        console.log(`\n--- ${fileName} in ${readProject} ---\n`);
        console.log(content);
        console.log(`\n--- End of ${fileName} ---\n`);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      break;
      
    case 'search':
      if (args.length < 3) {
        console.error('Error: Missing project name or search query');
        return;
      }
      
      const searchManager = new MemoryManager();
      const searchProject = args[1];
      const query = args[2];
      
      try {
        const searchResults = await searchManager.searchMemories({
          project: searchProject,
          query: query,
          limit: 5,
          similarityThreshold: 0.7
        });
        
        console.log(`\n--- Search results for "${query}" in ${searchProject} ---\n`);
        console.log(`Found ${searchResults.totalMatches} matches`);
        
        searchResults.memories.forEach((memory, index) => {
          const score = searchResults.scores ? searchResults.scores[index] : null;
          const scoreDisplay = score ? `(${Math.round(score * 100)}% match)` : '';
          
          console.log(`\n[${index + 1}] ${memory.title}.md ${scoreDisplay}`);
          console.log('-------------------------------------------');
          console.log(memory.content.substring(0, 150) + (memory.content.length > 150 ? '...' : ''));
        });
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      break;
      
    case 'analyze':
      if (args.length < 2) {
        console.error('Error: Missing project name');
        return;
      }
      
      const analyzeManager = new MemoryManager();
      const analyzeProject = args[1];
      
      try {
        const analysis = await analyzeManager.analyzeMemory(analyzeProject, 'all', true);
        console.log(analysis);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
  }
}

main().catch(console.error);