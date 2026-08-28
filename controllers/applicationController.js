const pool = require('../db');

// POST /api/applications — candidate applies to a job (protected)
exports.applyToJob = async (req, res) => {
  const { job_id } = req.body;
  const candidate_id = req.user.userId; // from the JWT, via protect middleware

  if (!job_id) {
    return res.status(400).json({ error: 'job_id is required' });
  }

  try {
    // Confirm the job actually exists
    const job = await pool.query('SELECT id FROM jobs WHERE id = $1', [job_id]);
    if (job.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Prevent duplicate applications to the same job
    const existing = await pool.query(
      'SELECT id FROM applications WHERE candidate_id = $1 AND job_id = $2',
      [candidate_id, job_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You have already applied to this job' });
    }

    const result = await pool.query(
      `INSERT INTO applications (candidate_id, job_id, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [candidate_id, job_id, 'applied']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Server error applying to job' });
  }
};

// GET /api/applications/mine — candidate's own applications (protected)
exports.getMyApplications = async (req, res) => {
  const candidate_id = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT applications.*, jobs.title, jobs.company, jobs.location
       FROM applications
       JOIN jobs ON applications.job_id = jobs.id
       WHERE applications.candidate_id = $1
       ORDER BY applications.applied_at DESC`,
      [candidate_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Server error fetching applications' });
  }
};

// PUT /api/applications/:id — update an application (protected, owner only)
exports.updateApplication = async (req, res) => {
  const { id } = req.params;
  const candidate_id = req.user.userId;
  const { status, employment_status } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM applications WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Ensure the logged-in candidate owns this application
    if (existing.rows[0].candidate_id !== candidate_id) {
      return res.status(403).json({ error: 'You do not have permission to modify this application' });
    }

    const result = await pool.query(
      `UPDATE applications
       SET status = $1, employment_status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, employment_status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update application error:', err);
    res.status(500).json({ error: 'Server error updating application' });
  }
};

// DELETE /api/applications/:id — withdraw an application (protected, owner only)
exports.deleteApplication = async (req, res) => {
  const { id } = req.params;
  const candidate_id = req.user.userId;

  try {
    const existing = await pool.query(
      'SELECT candidate_id FROM applications WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (existing.rows[0].candidate_id !== candidate_id) {
      return res.status(403).json({ error: 'You do not have permission to withdraw this application' });
    }

    await pool.query('DELETE FROM applications WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete application error:', err);
    res.status(500).json({ error: 'Server error withdrawing application' });
  }
};