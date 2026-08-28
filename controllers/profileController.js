const pool = require('../db');

// GET /api/profiles/me — get logged-in user's profile (protected)
exports.getMyProfile = async (req, res) => {
  const user_id = req.user.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// PUT /api/profiles/me — create or update profile (protected)
exports.updateMyProfile = async (req, res) => {
  const user_id = req.user.userId;
  const { full_name, headline, resume_url, skills } = req.body;

  try {
    const existing = await pool.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [user_id]
    );

    let result;

    if (existing.rows.length === 0) {
      // No profile yet — create one
      result = await pool.query(
        `INSERT INTO profiles (user_id, full_name, headline, resume_url, skills)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, full_name, headline, resume_url, skills]
      );
    } else {
      // Profile exists — update it
      result = await pool.query(
        `UPDATE profiles
         SET full_name = $1, headline = $2, resume_url = $3, skills = $4, updated_at = NOW()
         WHERE user_id = $5
         RETURNING *`,
        [full_name, headline, resume_url, skills, user_id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};