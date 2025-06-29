import express from 'express';
import { getDb } from './db.js';

const router = express.Router();

// GET /api/projects - returns all project names
router.get('/', async (req, res) => {
  const db = await getDb();
  try {
    const projects = await db.all('SELECT project_name FROM projects');
    res.json(projects.map(p => p.project_name));
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  } finally {
    await db.close();
  }
});

export default router;
