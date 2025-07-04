import express from 'express';
import { Octokit } from '@octokit/rest';

const router = express.Router();

// Initialize GitHub client
let octokit = null;

// Configure GitHub token
router.post('/configure', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'GitHub token is required' });
  }
  
  try {
    octokit = new Octokit({ auth: token });
    res.json({ message: 'GitHub configured successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to configure GitHub client' });
  }
});

// Get repository information
router.get('/repo/:owner/:repo', async (req, res) => {
  if (!octokit) {
    return res.status(401).json({ error: 'GitHub not configured' });
  }
  
  const { owner, repo } = req.params;
  
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get commit history
router.get('/commits/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const { page = 1, per_page = 10, sha, path, token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  try {
    const { data } = await githubClient.rest.repos.listCommits({
      owner,
      repo,
      page: parseInt(page),
      per_page: parseInt(per_page),
      sha,
      path,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get commit details
router.get('/commit/:owner/:repo/:sha', async (req, res) => {
  const { owner, repo, sha } = req.params;
  const { token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  try {
    const { data } = await githubClient.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file content
router.get('/content/:owner/:repo/:path', async (req, res) => {
  if (!octokit) {
    return res.status(401).json({ error: 'GitHub not configured' });
  }
  
  const { owner, repo, path } = req.params;
  const { ref } = req.query;
  
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare commits (get diff)
router.get('/compare/:owner/:repo/:base/:head', async (req, res) => {
  if (!octokit) {
    return res.status(401).json({ error: 'GitHub not configured' });
  }
  
  const { owner, repo, base, head } = req.params;
  
  try {
    const { data } = await octokit.rest.repos.compareCommits({
      owner,
      repo,
      base,
      head,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get branches
router.get('/branches/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const { token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  try {
    const { data } = await githubClient.rest.repos.listBranches({
      owner,
      repo,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search repositories
router.get('/search/repos', async (req, res) => {
  const { q, sort, order, per_page = 10, page = 1, token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    const { data } = await githubClient.rest.search.repos({
      q,
      sort,
      order,
      per_page: parseInt(per_page),
      page: parseInt(page),
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Analysis endpoint - analyze commit changes with intelligent insights
router.post('/analyze/:owner/:repo/:sha', async (req, res) => {
  const { owner, repo, sha } = req.params;
  const { token } = req.query;
  
  // Use token from query params or the globally configured one
  let githubClient = octokit;
  if (token) {
    githubClient = new Octokit({ auth: token });
  }
  
  if (!githubClient) {
    return res.status(401).json({ error: 'GitHub token required. Please provide token in query params or configure first.' });
  }
  
  try {
    // Get commit details with file changes
    const { data: commitData } = await githubClient.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });
    
    // Analyze the commit changes intelligently
    const analysis = analyzeCommitChanges(commitData);
    
    res.json({
      commit: {
        message: commitData.commit.message,
        author: commitData.commit.author,
        stats: commitData.stats
      },
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Intelligent AI Analysis function
function analyzeCommitChanges(commitData) {
  const { files, stats, commit } = commitData;
  const message = commit.message.toLowerCase();
  
  // Analyze file changes
  const fileAnalysis = analyzeFiles(files);
  
  // Categorize the commit type
  const commitType = categorizeCommit(message, fileAnalysis);
  
  // Generate intelligent summary
  const summary = generateIntelligentSummary(commitType, fileAnalysis, stats, commit.message, files);
  
  return {
    type: commitType,
    summary,
    fileChanges: fileAnalysis,
    impact: assessImpact(stats, fileAnalysis),
    recommendations: generateRecommendations(commitType, fileAnalysis),
    buildDescription: generateBuildDescription(fileAnalysis, commitType, commit.message)
  };
}

function analyzeFiles(files) {
  const analysis = {
    newFiles: [],
    modifiedFiles: [],
    deletedFiles: [],
    technologies: new Set(),
    components: [],
    features: [],
    categories: new Set(),
    uiChanges: false,
    backendChanges: false,
    configChanges: false,
    testChanges: false
  };
  
  files.forEach(file => {
    const filename = file.filename.toLowerCase();
    const extension = filename.split('.').pop();
    
    // Categorize by status
    if (file.status === 'added') {
      analysis.newFiles.push(file.filename);
    } else if (file.status === 'modified') {
      analysis.modifiedFiles.push(file.filename);
    } else if (file.status === 'removed') {
      analysis.deletedFiles.push(file.filename);
    }
    
    // Detect technologies and changes
    detectTechnology(filename, extension, analysis);
    detectChangeType(filename, analysis);
    detectComponents(filename, file.patch, analysis);
  });
  
  return analysis;
}

function detectTechnology(filename, extension, analysis) {
  // Frontend technologies
  if (extension === 'tsx' || extension === 'jsx') {
    analysis.technologies.add('React');
    analysis.uiChanges = true;
  }
  if (extension === 'ts' || extension === 'js') {
    analysis.technologies.add('TypeScript/JavaScript');
  }
  if (extension === 'css' || filename.includes('tailwind') || filename.includes('style')) {
    analysis.technologies.add('CSS/Styling');
    analysis.uiChanges = true;
  }
  if (filename.includes('package.json')) {
    analysis.technologies.add('Dependencies');
    analysis.configChanges = true;
  }
  
  // Backend technologies
  if (filename.includes('api/') || filename.includes('routes/') || filename.includes('backend/')) {
    analysis.technologies.add('Backend API');
    analysis.backendChanges = true;
  }
  if (filename.includes('database') || filename.includes('.sql') || filename.includes('db.')) {
    analysis.technologies.add('Database');
    analysis.backendChanges = true;
  }
  
  // Testing
  if (filename.includes('test') || filename.includes('spec') || extension === 'test.js') {
    analysis.technologies.add('Testing');
    analysis.testChanges = true;
  }
  
  // Configuration
  if (filename.includes('config') || filename.includes('.env') || extension === 'json' || extension === 'yml') {
    analysis.technologies.add('Configuration');
    analysis.configChanges = true;
  }
}

function detectChangeType(filename, analysis) {
  // UI Components
  if (filename.includes('component') || filename.includes('page') || filename.includes('view')) {
    analysis.categories.add('UI Components');
  }
  
  // API routes
  if (filename.includes('route') || filename.includes('api') || filename.includes('endpoint')) {
    analysis.categories.add('API Development');
  }
  
  // Authentication
  if (filename.includes('auth') || filename.includes('login') || filename.includes('user')) {
    analysis.categories.add('Authentication');
  }
  
  // GitHub integration (specific to your project)
  if (filename.includes('github')) {
    analysis.categories.add('GitHub Integration');
  }
}

function detectComponents(filename, patch, analysis) {
  if (!patch) return;
  
  const patchLower = patch.toLowerCase();
  
  // Detect specific features being built
  if (patchLower.includes('function') || patchLower.includes('const ') || patchLower.includes('class ')) {
    analysis.features.push('New Functions/Components');
  }
  if (patchLower.includes('usestate') || patchLower.includes('useeffect')) {
    analysis.features.push('React Hooks');
  }
  if (patchLower.includes('axios') || patchLower.includes('fetch')) {
    analysis.features.push('API Integration');
  }
  if (patchLower.includes('button') || patchLower.includes('form') || patchLower.includes('input')) {
    analysis.features.push('UI Elements');
  }
}

function categorizeCommit(message, fileAnalysis) {
  if (message.includes('feat') || message.includes('add') || fileAnalysis.newFiles.length > 0) {
    return 'Feature Addition';
  }
  if (message.includes('fix') || message.includes('bug')) {
    return 'Bug Fix';
  }
  if (message.includes('refactor') || message.includes('improve')) {
    return 'Code Refactoring';
  }
  if (message.includes('style') || message.includes('ui') || fileAnalysis.uiChanges) {
    return 'UI/UX Update';
  }
  if (message.includes('test') || fileAnalysis.testChanges) {
    return 'Testing';
  }
  if (message.includes('config') || fileAnalysis.configChanges) {
    return 'Configuration';
  }
  return 'General Update';
}

function generateIntelligentSummary(commitType, fileAnalysis, stats, commitMessage, files) {
  let summary = `## 🔍 Commit Analysis\n\n`;
  
  // Main description
  summary += `**What was built:** `;
  
  if (commitType === 'Feature Addition') {
    if (fileAnalysis.categories.has('GitHub Integration')) {
      summary += `This commit builds a new GitHub integration feature. `;
    } else if (fileAnalysis.uiChanges) {
      summary += `This commit builds new user interface components and pages. `;
    } else if (fileAnalysis.backendChanges) {
      summary += `This commit builds new backend functionality and API endpoints. `;
    } else {
      summary += `This commit introduces new functionality to the application. `;
    }
  } else if (commitType === 'UI/UX Update') {
    summary += `This commit improves the user interface and user experience. `;
  } else if (commitType === 'Bug Fix') {
    summary += `This commit fixes bugs and resolves issues in the application. `;
  } else {
    summary += `This commit modifies existing functionality. `;
  }
  
  // Specific technologies involved
  if (fileAnalysis.technologies.size > 0) {
    summary += `Technologies involved: ${Array.from(fileAnalysis.technologies).join(', ')}.\n\n`;
  }
  
  // Detailed breakdown
  summary += `**📊 Changes Breakdown:**\n`;
  summary += `- **Files affected:** ${files.length} files\n`;
  if (fileAnalysis.newFiles.length > 0) {
    summary += `- **New files:** ${fileAnalysis.newFiles.length} (${fileAnalysis.newFiles.slice(0, 3).join(', ')}${fileAnalysis.newFiles.length > 3 ? '...' : ''})\n`;
  }
  if (fileAnalysis.modifiedFiles.length > 0) {
    summary += `- **Modified files:** ${fileAnalysis.modifiedFiles.length}\n`;
  }
  if (fileAnalysis.deletedFiles.length > 0) {
    summary += `- **Deleted files:** ${fileAnalysis.deletedFiles.length}\n`;
  }
  summary += `- **Code changes:** +${stats.additions} additions, -${stats.deletions} deletions\n\n`;
  
  // Categories and features
  if (fileAnalysis.categories.size > 0) {
    summary += `**🎯 Areas of Development:**\n`;
    Array.from(fileAnalysis.categories).forEach(category => {
      summary += `- ${category}\n`;
    });
    summary += `\n`;
  }
  
  if (fileAnalysis.features.length > 0) {
    summary += `**⚡ Technical Features:**\n`;
    [...new Set(fileAnalysis.features)].forEach(feature => {
      summary += `- ${feature}\n`;
    });
    summary += `\n`;
  }
  
  return summary;
}

function generateBuildDescription(fileAnalysis, commitType, commitMessage) {
  let description = '';
  
  if (fileAnalysis.categories.has('GitHub Integration')) {
    description = 'Built a comprehensive GitHub integration system allowing users to connect their GitHub accounts, search repositories, analyze commit history, and view code differences with AI-powered insights.';
  } else if (fileAnalysis.uiChanges && fileAnalysis.backendChanges) {
    description = 'Built a full-stack feature with both frontend user interface components and backend API endpoints working together.';
  } else if (fileAnalysis.uiChanges) {
    description = 'Built new user interface components including interactive elements, forms, and visual components to enhance user experience.';
  } else if (fileAnalysis.backendChanges) {
    description = 'Built backend infrastructure including API routes, database interactions, and server-side logic to support application functionality.';
  } else {
    description = `Built ${commitType.toLowerCase()} focused on ${Array.from(fileAnalysis.technologies).join(' and ')} improvements.`;
  }
  
  return description;
}

function assessImpact(stats, fileAnalysis) {
  const totalChanges = stats.additions + stats.deletions;
  
  let riskLevel = 'Low';
  let description = 'Small, focused changes with minimal risk.';
  
  if (totalChanges > 500) {
    riskLevel = 'High';
    description = 'Large-scale changes that may affect multiple system components.';
  } else if (totalChanges > 100) {
    riskLevel = 'Medium';
    description = 'Moderate changes that should be tested thoroughly.';
  }
  
  if (fileAnalysis.configChanges) {
    riskLevel = 'Medium';
    description += ' Configuration changes require careful deployment.';
  }
  
  return {
    riskLevel,
    description,
    totalChanges,
    newFeatures: fileAnalysis.newFiles.length,
    areasAffected: Array.from(fileAnalysis.categories)
  };
}

function generateRecommendations(commitType, fileAnalysis) {
  const recommendations = [];
  
  if (commitType === 'Feature Addition') {
    recommendations.push('Test the new functionality thoroughly before deployment');
    recommendations.push('Update documentation to reflect new features');
  }
  
  if (fileAnalysis.uiChanges) {
    recommendations.push('Verify UI responsiveness across different screen sizes');
    recommendations.push('Test user interactions and accessibility');
  }
  
  if (fileAnalysis.backendChanges) {
    recommendations.push('Run API tests to ensure endpoint functionality');
    recommendations.push('Check database migrations if applicable');
  }
  
  if (fileAnalysis.configChanges) {
    recommendations.push('Review environment configuration changes');
    recommendations.push('Ensure all team members have updated configurations');
  }
  
  return recommendations;
}

export default router;
