import mongoose, { isValidObjectId } from 'mongoose';
import { Comment } from '../models/Comment.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { Video } from '../models/Video.model.js';
import { Tweet } from '../models/Tweet.model.js';

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortType = 'desc',
  } = req.query;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }
  const skip = (page - 1) * limit;
  const comments = await Comment.aggregate([
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$owner',
    },
    {
      $lookup: {
        from: 'likes',
        let: { commentId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$comment', '$$commentId'] },
                  {
                    $eq: [
                      '$likedBy',
                      new mongoose.Types.ObjectId(req.user._id),
                    ],
                  },
                ],
              },
            },
          },
          { $limit: 1 }, // optimization
        ],
        as: 'isLikedArr',
      },
    },
    {
      $addFields: {
        isLiked: { $gt: [{ $size: '$isLikedArr' }, 0] },
      },
    },
    {
      $project: {
        isLikedArr: 0, // optional: remove helper array
      },
    },
  ]);
  if (!comments || comments.length === 0) {
    throw new ApiError(404, 'No Comments found');
  }
  const totalComments = await Comment.countDocuments({
    video: videoId,
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        comments,
      },
      'Comments fetched successfully',
    ),
  );
});

const getTweetComments = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortType = 'desc',
  } = req.query;
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid video ID');
  }
  const skip = (page - 1) * limit;
  const comments = await Comment.aggregate([
    {
      $match: { tweet: new mongoose.Types.ObjectId(tweetId) },
    },
    {
      $sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$owner',
    },
    {
      $lookup: {
        from: 'likes',
        let: { commentId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$comment', '$$commentId'] },
                  {
                    $eq: [
                      '$likedBy',
                      new mongoose.Types.ObjectId(req.user._id),
                    ],
                  },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'isLikedArr',
      },
    },
    {
      $addFields: {
        isLiked: { $gt: [{ $size: '$isLikedArr' }, 0] },
      },
    },
    {
      $project: {
        isLikedArr: 0, // optional: remove helper array
      },
    },
  ]);
  if (!comments || comments.length === 0) {
    throw new ApiError(404, 'No Comments found');
  }
  const totalComments = await Comment.countDocuments({
    tweet: tweetId,
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        comments,
      },
      'Comments fetched successfully',
    ),
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, 'Content is required');
  }
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  const videoDetail = await Video.findById(videoId);
  if (!videoDetail) {
    throw new ApiError(400, 'Invalid Video ID');
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, 'Comment added successfully'));
});

const addTweetComment = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, 'Content is required');
  }
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet ID');
  }
  const tweetDetail = await Tweet.findById(tweetId);
  if (!tweetDetail) {
    throw new ApiError(400, 'Invalid Tweet ID');
  }
  const comment = await Comment.create({
    content,
    tweet: tweetId,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, 'Comment added successfully'));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, 'Content is required');
  }
  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment ID');
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check if the current user is the owner
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this comment');
  }

  // Now update the comment
  comment.content = content;
  await comment.save();
  return res
    .status(200)
    .json(new ApiResponse(200, comment, 'Comment updated successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment ID');
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check if the current user is the owner
  if (comment.owner.toString() === req.user._id.toString()) {
    await comment.deleteOne();
  } else {
    const video = await Video.findById(comment.video);
    if (video?.owner.toString === req.user._id.toString()) {
      await comment.deleteOne();
    } else {
      throw new ApiError(403, 'You are not authorized to delete this comment');
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Comment deleted successfully'));
});
const deleteTweetComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment ID');
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check if the current user is the owner
  if (comment.owner.toString() === req.user._id.toString()) {
    await comment.deleteOne();
  } else {
    const tweet = await Tweet.findById(comment.tweet);
    if (tweet?.owner.toString === req.user._id.toString()) {
      await comment.deleteOne();
    } else {
      throw new ApiError(403, 'You are not authorized to delete this comment');
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Comment deleted successfully'));
});
export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  addTweetComment,
  getTweetComments,
  deleteTweetComment,
};
