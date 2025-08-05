import mongoose, { isValidObjectId } from 'mongoose';
import { User } from '../models/User.model.js';
import { Subscription } from '../models/Subscriptions.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id.toString();
  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channel ID');
  }
  if (channelId === userId) {
    throw new ApiError(400, 'You cannot subscribe to your own channel');
  }
  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user ID');
  }
  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });
  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          existingSubscription,
          'Unsubscribed successfully!',
        ),
      );
  } else {
    const subscriptionModel = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, subscriptionModel, 'Subscribed successfully!'),
      );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortType = 'desc',
  } = req.query;
  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channel ID');
  }
  const skip = (page - 1) * limit;
  const subscribers = await Subscription.find({ channel: channelId })
    .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 }) // Sorting based on the query parameters
    .skip(skip) // Skipping documents for pagination
    .limit(parseInt(limit)); // Limiting the number of documents
  if (!subscribers || subscribers.length === 0) {
    throw new ApiError(404, 'No subscribers found');
  }
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          subscribers,
          totalSubscribers,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalSubscribers / limit),
        },
        'Subscribers fetched successfully!',
      ),
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortType = 'desc',
  } = req.query;
  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, 'Invalid subscriber ID');
  }
  const skip  = (page - 1) * limit;
  const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 }) // Sorting based on the query parameters
    .skip(skip) // Skipping documents for pagination
    .limit(parseInt(limit)); // Limiting the number of documents
  if (!subscriptions || subscriptions.length === 0) {
    throw new ApiError(404, 'No subscriptions found');
  }
  const totalSubscriptions = await Subscription.countDocuments({
    subscriber: subscriberId,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          subscriptions,
          totalSubscriptions,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalSubscriptions / limit),
        },
        'Subscribed channels fetched successfully!',
      ),
    );
});

const getChannelDetails = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid channel ID');
  }
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  getChannelDetails,
};
