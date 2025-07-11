import express from 'express';
import { getDb } from './db.js';

const router = express.Router();

// GET /api/projects - returns all project names
router.get('/', async (req, res) => {
  const db = await getDb();
  try {
    const projects = await db.all('SELECT project_name FROM projects ORDER BY project_name');
    res.json(projects.map(p => p.project_name));
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  } finally {
    await db.close();
  }
});

// GET /api/projects/with-github - returns project names with associated GitHub repositories
router.get('/with-github', async (req, res) => {
  const db = await getDb();
  try {
    const projects = await db.all("SELECT project_name FROM projects WHERE GitHub_project IS NOT NULL AND GitHub_project != ''");
    res.json(projects.map(p => p.project_name));
  } catch (error) {
    console.error('Error fetching projects with GitHub:', error);
    res.status(500).json({ error: 'Failed to fetch projects with GitHub' });
  } finally {
    await db.close();
  }
});

export default router;
