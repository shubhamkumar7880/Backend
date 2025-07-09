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

  const tweets = await Tweet.find({ owner: user._id })
    .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 }) // Sorting based on the query parameters
    .skip(skip) // Skipping documents for pagination
    .limit(parseInt(limit)); // Limiting the number of documents

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
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
