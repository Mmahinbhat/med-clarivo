const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');

// GET /api/curriculum/subjects?examGroup=NEET_UG
// Returns all subjects + chapters for a given exam group
router.get('/subjects', protect, async (req, res) => {
  try {
    const { examGroup } = req.query;
    
    if (!examGroup) {
      return res.status(400).json({
        success: false,
        message: 'examGroup query param required',
      });
    }

    const subjects = await Subject.find({ examGroup }).sort({ order: 1 });

    const enriched = await Promise.all(
      subjects.map(async (subject) => {
        const chapters = await Chapter.find({ subject: subject._id }).sort({ order: 1 });
        return {
          _id: subject._id,
          name: subject.name,
          examGroup: subject.examGroup,
          color: subject.color,
          chapters: chapters.map(ch => ({
            _id: ch._id,
            title: ch.title,
          })),
        };
      })
    );

    res.json({ success: true, subjects: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
  }
});

module.exports = router;
