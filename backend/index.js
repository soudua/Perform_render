import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import usersRoutes from './routes/users.js';
import informationRoutes from './routes/information.js';
import clientsRoutes from './routes/clients.js';
import absencesRoutes from './routes/absences.js';
import projectsRoutes from './routes/projects.js';
import projectUsersRoutes from './routes/projectUsers.js';
import userRolesRoutes from './routes/userRoles.js';
import userHoursRoutes from './routes/userHours.js';
import projectTotalHoursRoutes from './routes/projectTotalHours.js';
import projectTimelineRoutes from './routes/projectTimeline.js';
import projectCostRoutes from './routes/projectCost.js';
import projectBudgetRoutes from './routes/projectBudget.js';
import projectRiskByMonthRoutes from './routes/projectRiskByMonth.js';
import adminClientsRoutes from './routes/adminClients.js';
import adminProjectsRoutes from './routes/adminProjects.js';
import adminUsersRoutes from './routes/adminUsers.js';
import emailRoutes from './routes/email.js';
import githubRoutes from './routes/github.js';
import { initDb, getDb } from './routes/db.js';


const app = express();
const PORT = process.env.PORT || 4000;

// Configure CORS for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:3000',
      'https://pfe-duarte.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json()); // to parse JSON body

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'PerformPass API Server',
    status: 'running',
    endpoints: ['/api/users', '/api/information', '/api/clients', '/api/absences']
  });
});

app.use('/api/users', usersRoutes);
app.use('/api/information', informationRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/absences', absencesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/project-users', projectUsersRoutes);
app.use('/api/user-roles', userRolesRoutes);
app.use('/api/user-hours', userHoursRoutes);
app.use('/api/project-total-hours', projectTotalHoursRoutes);
app.use('/api/project-timeline', projectTimelineRoutes);
app.use('/api/project-cost', projectCostRoutes);
app.use('/api/project-budget', projectBudgetRoutes);
app.use('/api/project-risk-by-month', projectRiskByMonthRoutes);
app.use('/api/admin/clients', adminClientsRoutes);
app.use('/api/admin/projects', adminProjectsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/github', githubRoutes);

// Database migration function
async function runDatabaseMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    const db = await getDb();
    
    // Check if github_account column exists and add it if missing
    const columns = await db.all("PRAGMA table_info(utilizadores)");
    const hasGithubColumn = columns.some(col => col.name === 'github_account');
    
    if (!hasGithubColumn) {
      console.log('📝 Adding github_account column to utilizadores table...');
      await db.run('ALTER TABLE utilizadores ADD COLUMN github_account TEXT DEFAULT NULL');
      console.log('✅ github_account column added successfully');
      
      // Set default GitHub account for admin user (user_id = 1)
      console.log('🔧 Setting default GitHub account for admin user...');
      await db.run("UPDATE utilizadores SET github_account = 'soudua' WHERE user_id = 1");
      
      // Also set GitHub accounts for other key users if they exist
      await db.run("UPDATE utilizadores SET github_account = 'soudua' WHERE email = 'suporte@grupoerre.pt'");
      
      console.log('✅ Default GitHub account set for admin user');
    } else {
      console.log('✅ github_account column already exists');
      
      // Check if admin user has github_account set
      const adminUser = await db.get('SELECT github_account FROM utilizadores WHERE user_id = 1');
      if (!adminUser || !adminUser.github_account) {
        console.log('🔧 Setting GitHub account for admin user (was empty)...');
        await db.run("UPDATE utilizadores SET github_account = 'soudua' WHERE user_id = 1");
        console.log('✅ Admin GitHub account updated');
      } else {
        console.log(`✅ Admin user already has GitHub account: ${adminUser.github_account}`);
      }
    }
    
    await db.close();
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
}

async function forceAdminPasswordReset() {
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Force resetting admin password in production...');
    
    try {
      const { getDb } = await import('./routes/db.js');
      const bcrypt = await import('bcrypt');
      
      const db = await getDb();
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.run('UPDATE utilizadores SET password = ? WHERE email = ?', 
                   [hashedPassword, 'suporte@grupoerre.pt']);
      
      console.log('✅ Admin password force-updated to: admin123');
      await db.close();
    } catch (error) {
      console.error('❌ Failed to force-update admin password:', error);
    }
  }
}

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initDb();
    console.log('✅ Database initialized successfully');
    
    // Run database migrations
    await runDatabaseMigrations();
    
    // Force admin password reset if in production
    await forceAdminPasswordReset();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

export default app;
