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
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
