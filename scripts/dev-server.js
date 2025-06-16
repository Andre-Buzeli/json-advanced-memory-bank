#!/usr/bin/env node

/**
 * Development server for Advanced Memory Bank MCP
 * Provides live monitoring and debugging capabilities
 */

import { createServer } from 'http';
import { MemoryManager } from '../dist/core/memory-manager.js';
import { ProjectDetector } from '../dist/core/project/project-detector.js';
import { CacheManager } from '../dist/core/storage/cache-manager.js';

const PORT = process.env.DEV_PORT || 3001;
const REFRESH_INTERVAL = process.env.DEV_REFRESH || 5000;

class DevServer {
  constructor() {
    console.log('🚀 Starting Advanced Memory Bank MCP Development Server...\n');
    
    this.stats = {};
    
    // Initialize components
    this.projectDetector = new ProjectDetector();
    this.cacheManager = new CacheManager();
    this.memoryManager = new MemoryManager();
    
    // Start monitoring
    this.startMonitoring();
    this.createServer();
  }

  createServer() {
    this.server = createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const url = new URL(req.url || '', `http://localhost:${PORT}`);
      
      switch (url.pathname) {
        case '/':
          res.end(this.generateDashboard());
          break;
        case '/api/stats':
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(this.stats, null, 2));
          break;
        case '/api/refresh':
          this.refreshStats();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
          break;
        default:
          res.statusCode = 404;
          res.end('Not Found');
      }
    });

    this.server.listen(PORT, () => {
      console.log(`📊 Development Dashboard: http://localhost:${PORT}`);
      console.log(`📡 API Endpoint: http://localhost:${PORT}/api/stats`);
      console.log(`🔄 Auto-refresh: every ${REFRESH_INTERVAL}ms\n`);
      this.printInitialStatus();
    });
  }

  private generateDashboard(): string {
    const projectInfo = this.projectDetector.getProjectInfo();
    const cacheStats = this.cacheManager.getStats();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Advanced Memory Bank MCP - Development Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0; padding: 20px; background: #1a1a1a; color: #e0e0e0;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
            background: #2d2d2d; border-radius: 8px; padding: 20px; border: 1px solid #404040;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .card h3 { margin-top: 0; color: #4CAF50; border-bottom: 1px solid #404040; padding-bottom: 10px; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.running { background: #4CAF50; color: white; }
        .status.warning { background: #FF9800; color: white; }
        .status.error { background: #f44336; color: white; }
        .metric { display: flex; justify-content: space-between; margin: 8px 0; }
        .metric-label { color: #bbb; }
        .metric-value { font-weight: bold; color: #4CAF50; }
        .refresh-btn { 
            background: #4CAF50; color: white; border: none; padding: 10px 20px; 
            border-radius: 4px; cursor: pointer; margin: 10px 5px;
        }
        .refresh-btn:hover { background: #45a049; }
        .log { background: #1e1e1e; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; }
        .timestamp { color: #666; }
        .error { color: #f44336; }
        .success { color: #4CAF50; }
        .warning { color: #FF9800; }
        @media (prefers-color-scheme: light) {
            body { background: #f5f5f5; color: #333; }
            .card { background: white; border: 1px solid #ddd; }
            .log { background: #f8f8f8; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 Advanced Memory Bank MCP</h1>
            <p>Development Dashboard - Live Monitoring</p>
            <span class="status running">RUNNING</span>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📁 Project Detection</h3>
                <div class="metric">
                    <span class="metric-label">Current Project:</span>
                    <span class="metric-value">${projectInfo.name}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Detection Method:</span>
                    <span class="metric-value">${projectInfo.detectionMethod}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Working Directory:</span>
                    <span class="metric-value">${projectInfo.path}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Is Default:</span>
                    <span class="metric-value">${projectInfo.isDefault ? 'Yes' : 'No'}</span>
                </div>
            </div>

            <div class="card">
                <h3>💾 Cache Performance</h3>
                <div class="metric">
                    <span class="metric-label">Cache Hits:</span>
                    <span class="metric-value">${cacheStats.hits}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Cache Misses:</span>
                    <span class="metric-value">${cacheStats.misses}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Hit Ratio:</span>
                    <span class="metric-value">${cacheStats.hits + cacheStats.misses > 0 ? 
                      ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1) : 0}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Cache Size:</span>
                    <span class="metric-value">${cacheStats.size} entries</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory Usage:</span>
                    <span class="metric-value">${(cacheStats.memoryUsage / 1024 / 1024).toFixed(2)} MB</span>
                </div>
            </div>

            <div class="card">
                <h3>📊 System Statistics</h3>
                <div class="metric">
                    <span class="metric-label">Node.js Version:</span>
                    <span class="metric-value">${process.version}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Platform:</span>
                    <span class="metric-value">${process.platform}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory Usage:</span>
                    <span class="metric-value">${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime:</span>
                    <span class="metric-value">${Math.floor(process.uptime())} seconds</span>
                </div>
            </div>

            <div class="card">
                <h3>🔧 Quick Actions</h3>
                <button class="refresh-btn" onclick="refreshStats()">🔄 Refresh Stats</button>
                <button class="refresh-btn" onclick="clearCache()">🗑️ Clear Cache</button>
                <button class="refresh-btn" onclick="createBackup()">💾 Manual Backup</button>
                <button class="refresh-btn" onclick="viewLogs()">📝 View Logs</button>
            </div>

            <div class="card">
                <h3>📋 Recent Activity</h3>
                <div class="log" id="activity-log">
                    <div class="timestamp">[${new Date().toISOString()}]</div>
                    <div class="success">✅ Development server started</div>
                    <div class="success">✅ Project detection: ${projectInfo.name}</div>
                    <div class="success">✅ Cache manager initialized</div>
                    <div class="success">✅ Memory manager ready</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function refreshStats() {
            fetch('/api/refresh')
                .then(r => r.json())
                .then(data => {
                    console.log('Stats refreshed:', data);
                    location.reload();
                })
                .catch(err => console.error('Refresh failed:', err));
        }

        function clearCache() {
            if (confirm('Clear all cache entries?')) {
                // This would call the cache clear API
                alert('Cache cleared (API not implemented yet)');
            }
        }

        function createBackup() {
            if (confirm('Create manual backup now?')) {
                // This would call the backup API
                alert('Manual backup created (API not implemented yet)');
            }
        }

        function viewLogs() {
            window.open('/api/logs', '_blank');
        }

        // Auto-refresh every ${REFRESH_INTERVAL}ms
        setInterval(() => {
            refreshStats();
        }, ${REFRESH_INTERVAL});
    </script>
</body>
</html>`;
  }

  private startMonitoring() {
    console.log('📊 Starting monitoring...');
    
    setInterval(() => {
      this.refreshStats();
    }, REFRESH_INTERVAL);
  }

  private refreshStats() {
    try {
      const projectInfo = this.projectDetector.getProjectInfo();
      const cacheStats = this.cacheManager.getStats();
      
      this.stats = {
        timestamp: new Date().toISOString(),
        project: projectInfo,
        cache: cacheStats,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime()
        }
      };
    } catch (error) {
      console.error('❌ Error refreshing stats:', error);
    }
  }

  private printInitialStatus() {
    const projectInfo = this.projectDetector.getProjectInfo();
    
    console.log('📋 CURRENT STATUS');
    console.log('─'.repeat(50));
    console.log(`🎯 Project: ${projectInfo.name}`);
    console.log(`📁 Method: ${projectInfo.detectionMethod}`);
    console.log(`📂 Path: ${projectInfo.path}`);
    console.log(`💾 Cache: ${this.cacheManager.getSummary()}`);
    console.log('─'.repeat(50));
    console.log('');
    console.log('🔍 Watching for changes...');
    console.log('💡 Press Ctrl+C to stop\n');
  }

  public stop() {
    if (this.server) {
      this.server.close();
    }
    if (this.cacheManager) {
      this.cacheManager.destroy();
    }
    console.log('\n🛑 Development server stopped');
  }
}

// Handle graceful shutdown
const devServer = new DevServer();

process.on('SIGINT', () => {
  devServer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  devServer.stop();
  process.exit(0);
});

export default DevServer;
