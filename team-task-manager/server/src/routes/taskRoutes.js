const express = require('express');
const router = express.Router();
const {
  createTask, getAllTasks, getTaskById, updateTask,
  updateTaskStatus, deleteTask, addComment, getDashboardStats
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { taskValidator, taskStatusValidator, commentValidator } = require('../middleware/validate');

router.use(protect);

router.get('/dashboard/stats', getDashboardStats);

router.route('/')
  .get(getAllTasks)
  .post(isAdmin, taskValidator, createTask);

router.route('/:id')
  .get(getTaskById)
  .put(isAdmin, updateTask)
  .delete(isAdmin, deleteTask);

router.patch('/:id/status', taskStatusValidator, updateTaskStatus);

router.post('/:id/comments', commentValidator, addComment);

module.exports = router;