import { Router } from 'express';
import {
  addComment,
  addTweetComment,
  deleteComment,
  deleteTweetComment,
  getTweetComments,
  getVideoComments,
  updateComment,
} from '../controllers/Comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route('/:videoId').get(getVideoComments).post(addComment);

router.route('/tweet/:tweetId').post(addTweetComment).get(getTweetComments);
router.route('/c/:commentId').delete(deleteComment).patch(updateComment);
router.route('/tweet/c/:commentId').delete(deleteTweetComment);

export default router;
