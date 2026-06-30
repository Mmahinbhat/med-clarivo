// Seeds Subject + Chapter collections with real curriculum structure
// per exam group. Safe to re-run — upserts, never duplicates.
//
// Usage:
//   MONGO_URI="your_connection_string" node scripts/seedCurriculum.js

require('dotenv').config();
const mongoose = require('mongoose');
const Subject  = require('../models/Subject');
const Chapter  = require('../models/Chapter');

const COLORS = ['#2563EB', '#0FA89A', '#7C3AED', '#DB2777', '#EA580C', '#65A30D'];

// ── Curriculum data ────────────────────────────────────────────
// chapters listed here are a real, representative starting set per
// subject — not the exhaustive official syllabus. Easy to extend
// later by adding more entries to any subject's chapter array.
const CURRICULUM = {
  NEET_UG: {
    Physics: ['Mechanics', 'Thermodynamics', 'Electrodynamics', 'Optics', 'Modern Physics', 'Waves & Oscillations'],
    Chemistry: ['Physical Chemistry', 'Organic Chemistry Basics', 'Reaction Mechanisms', 'Inorganic Chemistry', 'Coordination Compounds', 'Biomolecules'],
    Biology: ['Cell Biology', 'Genetics & Evolution', 'Human Physiology', 'Plant Physiology', 'Ecology & Environment', 'Human Reproduction'],
  },
  PG_CLINICAL: {
    'Anatomy': ['Gross Anatomy – Upper Limb', 'Neuroanatomy', 'Embryology Basics'],
    'Physiology': ['Cardiovascular Physiology', 'Renal Physiology', 'Endocrine Physiology'],
    'Biochemistry': ['Enzymology', 'Metabolism', 'Molecular Biology Basics'],
    'Pathology': ['General Pathology', 'Systemic Pathology – Cardiovascular', 'Neoplasia'],
    'Pharmacology': ['General Pharmacology', 'Autonomic Nervous System Drugs', 'Chemotherapy'],
    'Microbiology': ['Bacteriology Basics', 'Virology', 'Immunology Basics'],
    'Forensic Medicine & Toxicology': ['Medico-legal Autopsy', 'Common Poisons', 'Forensic Examination'],
    'Community Medicine (PSM)': ['Epidemiology Basics', 'National Health Programmes', 'Biostatistics'],
    'General Medicine': ['Cardiology', 'Endocrinology', 'Infectious Diseases'],
    'General Surgery': ['Trauma & Critical Care', 'Surgical Oncology', 'GI Surgery'],
    'Obstetrics & Gynaecology': ['High-risk Obstetrics', 'Gynaecological Oncology', 'Infertility'],
    'Paediatrics': ['Neonatology', 'Growth & Development', 'Paediatric Infections'],
    'ENT': ['Otology Basics', 'Rhinology', 'Laryngology'],
    'Ophthalmology': ['Cataract & Lens', 'Glaucoma', 'Retina Basics'],
    'Orthopaedics': ['Fractures & Trauma', 'Joint Disorders', 'Spine Basics'],
    'Dermatology': ['Common Dermatoses', 'Infections of Skin', 'Drug Reactions'],
    'Psychiatry': ['Mood Disorders', 'Psychosis', 'Substance Use Disorders'],
    'Anaesthesia': ['General Anaesthesia Basics', 'Regional Anaesthesia', 'Critical Care Basics'],
    'Radiology': ['Chest Imaging Basics', 'Abdominal Imaging', 'CNS Imaging Basics'],
  },
  USMLE_STEP1: {
    'Anatomy & Embryology': ['Gross Anatomy Essentials', 'Embryology Basics'],
    'Physiology': ['Cardiovascular & Renal', 'Endocrine & Reproductive'],
    'Biochemistry & Genetics': ['Metabolic Pathways', 'Molecular Genetics'],
    'Pathology': ['General Pathology', 'Systemic Pathology Overview'],
    'Pharmacology': ['Pharmacokinetics & Dynamics', 'Drug Classes Overview'],
    'Microbiology & Immunology': ['Bacteriology & Virology', 'Immune System Basics'],
    'Behavioral Science': ['Biostatistics', 'Patient Communication & Ethics'],
  },
  USMLE_STEP2: {
    'Internal Medicine': ['Cardiology', 'Endocrinology', 'Infectious Disease'],
    'Surgery': ['Trauma & Acute Care', 'Perioperative Management'],
    'Obstetrics & Gynaecology': ['Antenatal Care', 'Gynaecologic Disorders'],
    'Paediatrics': ['Neonatal Care', 'Common Childhood Illness'],
    'Psychiatry': ['Mood & Anxiety Disorders', 'Psychotic Disorders'],
    'Family Medicine': ['Preventive Screening', 'Chronic Disease Management'],
  },
  USMLE_STEP3: {
    'Patient Management': ['Multi-system Care Cases', 'Critical Decision Making'],
    'Ambulatory Medicine': ['Preventive Care', 'Chronic Disease Follow-up'],
    'Clinical Therapeutics': ['Drug Interactions', 'Treatment Protocols'],
    'Preventive Medicine': ['Screening Guidelines', 'Public Health Basics'],
  },
};

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not set. Run with: MONGO_URI="..." node scripts/seedCurriculum.js');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  let subjectCount = 0;
  let chapterCount = 0;

  for (const [examGroup, subjects] of Object.entries(CURRICULUM)) {
    let subjOrder = 0;
    for (const [subjectName, chapterTitles] of Object.entries(subjects)) {
      const color = COLORS[subjOrder % COLORS.length];

      const subject = await Subject.findOneAndUpdate(
        { examGroup, name: subjectName },
        { $set: { order: subjOrder, color } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      subjectCount++;
      subjOrder++;

      let chOrder = 0;
      for (const title of chapterTitles) {
        await Chapter.findOneAndUpdate(
          { subject: subject._id, title },
          { $set: { order: chOrder, totalUnits: 4, estimatedMinutes: 45 } },
          { upsert: true, setDefaultsOnInsert: true }
        );
        chapterCount++;
        chOrder++;
      }
    }
    console.log(`  ${examGroup}: ${Object.keys(subjects).length} subjects seeded`);
  }

  console.log(`\n✅ Done. ${subjectCount} subject upserts, ${chapterCount} chapter upserts.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
