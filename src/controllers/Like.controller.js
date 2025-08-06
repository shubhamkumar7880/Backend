import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from '../models/Like.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new Error(400, 'Invalid Video Id');
  }
  const likedVideo = await Like.findOne({
    likedBy: req.user._id,
    video: videoId,
  });
  if (likedVideo) {
    await likedVideo.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Video unliked successfully'));
  }
  const newLike = await Like.create({
    likedBy: req.user._id,
    video: videoId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newLike, 'Video liked successfully'));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId || !isValidObjectId(commentId)) {
    throw new Error(400, 'Invalid Comment Id');
  }
  const likedComment = await Like.findOne({
    likedBy: req.user._id,
    comment: commentId,
  });
  if (likedComment) {
    await likedComment.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Comment unliked successfully'));
  }
  const newLike = await Like.create({
    likedBy: req.user._id,
    comment: commentId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newLike, 'Comment liked successfully'));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new Error(400, 'Invalid Tweet Id');
  }
  const likedTweet = await Like.findOne({
    likedBy: req.user._id,
    tweet: tweetId,
  });
  if (likedTweet) {
    await likedTweet.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Tweet unliked successfully'));
  }
  const newLike = await Like.create({
    likedBy: req.user._id,
    tweet: tweetId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newLike, 'Tweet liked successfully'));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: { $ne: null },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, 'Liked videos fetched successfully'),
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
