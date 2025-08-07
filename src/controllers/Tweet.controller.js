import mongoose, { isValidObjectId } from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { Tweet } from '../models/Tweet.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Content is required');
  }

  const tweetModel = await Tweet.create({
    content: content.trim(),
    owner: isValidObjectId(req.user._id) ? req.user._id : null,
  });

  if (!tweetModel) {
    throw new ApiError(500, 'Failed to post tweet');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, tweetModel, 'Tweet posted successfully'));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortType = 'desc',
  } = req.query;
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, 'UserID is required');
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const skip = (page - 1) * limit;
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $sort: {
        [sortBy]: sortType === 'desc' ? -1 : 1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: 'likes',
        foreignField: 'tweet',
        localField: '_id',
        as: 'likes',
      },
    },
    {
      $addFields: {
        isLiked: {
          $cond: {
            if: {
              $in: [req.user._id, '$likes.likedBy'],
            },
            then: true,
            else: false,
          },
        },
        likes: { $size: '$likes' },
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'tweet',
        as: 'commentsCount',
      },
    },
    {
      $addFields: {
        commentsCount: { $size: '$commentsCount' },
      },
    },
  ]);
  if (!tweets || tweets.length === 0) {
    throw new ApiError(404, 'No tweets found');
  }
  const totalTweets = await Tweet.countDocuments({
    owner: user._id,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalTweets / limit),
        totalTweets,
        tweets,
      },
      'Tweets fetched successfully',
    ),
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  let tweet;
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Content is required');
  }
  if (!tweetId) {
    throw new ApiError(400, 'Tweet ID is required');
  }
  const tweetData = await Tweet.findById(tweetId);
  if (!tweetData) {
    throw new ApiError(404, 'Tweet not found');
  }
  if (tweetData.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this tweet');
  }
  tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content } },
    { new: true },
  );
  if (!tweet) {
    throw new ApiError(500, 'Failed to update tweet');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, 'Tweet updated successfully!'));
});

const deleteTweet = asyncHandler(async (req, res) => {
  let tweet;
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, 'Tweet ID is required');
  }
  const tweetData = await Tweet.findById(tweetId);
  if (!tweetData) {
    throw new ApiError(404, 'Tweet not found');
  }
  if (tweetData.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this tweet');
  }
  tweet = await Tweet.findByIdAndDelete(tweetId);
  if (!tweet) {
    throw new ApiError(500, 'Failed to delete tweet');
  }
  return res
    .status(201)
    .json(new ApiResponse(201, tweet, 'Tweet deleted successfully!'));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
