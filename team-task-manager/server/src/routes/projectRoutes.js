const express = require('express');
const router = express.Router();
const {
  createProject, getAllProjects, getProjectById,
  updateProject, deleteProject, addMembers, removeMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { projectValidator } = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(getAllProjects)
  .post(isAdmin, projectValidator, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(isAdmin, projectValidator, updateProject)
  .delete(isAdmin, deleteProject);

router.post('/:id/members', isAdmin, addMembers);
router.delete('/:id/members/:userId', isAdmin, removeMember);

module.exports = router;