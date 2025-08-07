import { Video } from '../models/Video.model.js';
import { User } from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import { Like } from '../models/Like.model.js';
import mongoose from 'mongoose';

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    username,
    sortBy = 'createdAt',
    sortType = 'desc',
  } = req.query;
  if (!username) {
    throw new ApiError(400, 'Username is required');
  }
  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const skip = (page - 1) * limit;

  const videos = await Video.find({ owner: user._id, isPublished: true })
    .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 }) // Sorting based on the query parameters
    .skip(skip) // Skipping documents for pagination
    .limit(parseInt(limit)); // Limiting the number of documents

  if (!videos) {
    throw new ApiError(404, 'No videos found');
  }
  const totalVideos = await Video.countDocuments({
    owner: user._id,
    isPublished: true,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalVideos / limit),
        totalVideos,
        videos,
      },
      'Videos fetched successfully',
    ),
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!(title && description)) {
    throw new ApiError(400, 'Title and description are required');
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!(videoLocalPath && thumbnailLocalPath)) {
    throw new ApiError(400, 'Video and thumbnail file is required');
  }
  const video = await uploadOnCloudinary(videoLocalPath);
  if (!video) {
    throw new ApiError(400, 'Failed to upload video');
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(400, 'Failed to upload thumbnail');
  }

  const videoModel = await Video.create({
    title,
    description,
    duration: video?.duration,
    views: 0,
    videoFile: video?.url,
    isPublished: true,
    thumbnail: thumbnail?.url,
    owner: req.user?._id,
  });

  if (!videoModel) {
    throw new ApiError(500, 'Failed to create video');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, videoModel, 'Video created successfully'));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, 'Video ID is required');
  }
  try {
    const video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId), // mongoose doesn't support here in pipeline, so, we need to make mongoose id using new mongoose.Types.ObjectId.
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'channel',
          pipeline: [
            {
              $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribersCount',
              },
            },
            {
              $addFields: {
                isSubscribed: {
                  $cond: {
                    if: {
                      $in: [req.user?._id, '$subscribersCount.subscriber'],
                    }, // check if user is present in the subscriber object as subscriber(field).
                    then: true,
                    else: false,
                  },
                },
                subscribersCount: { $size: '$subscribersCount' },
              },
            },
            {
              $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                isSubscribed: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'video',
          as: 'totalLikes',
        },
      },
      {
        $addFields: {
          isLiked: {
            $cond: {
              if: {
                $in: [req.user?._id, '$totalLikes.likedBy'],
              },
              then: true,
              else: false,
            },
          },
          totalLikes: { $size: '$totalLikes' },
        },
      },
      {
        $addFields: {
          channel: {
            // if we write same name, then, it overrides the data.
            $first: '$channel', // first operator returns 0th index of an array.
          },
        },
      },
    ]);
    if (!video || !video?.length) {
      throw new ApiError(404, 'Video not found');
    }
    return res
      .status(200)
      .json(new ApiResponse(200, video?.[0], 'Video fetched successfully!'));
  } catch (error) {
    throw new ApiError(500, error?.message || 'failed to fetch video!');
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  let video;
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!(title && description)) {
    throw new ApiError(400, 'Title and description are required');
  }
  if (!videoId) {
    throw new ApiError(400, 'Video ID is required');
  }
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new ApiError(400, 'Failed to upload thumbnail');
    }
    video = await Video.findByIdAndUpdate(
      videoId,
      { $set: { title, description, thumbnail: thumbnail?.url } },
      { new: true },
    );
  } else {
    video = await Video.findByIdAndUpdate(
      videoId,
      { $set: { title, description } },
      { new: true },
    );
  }
  if (!video) {
    throw new ApiError(500, 'Failed to update video deatils');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, video, 'Video details updated successfully!'));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    const deletedVideo = await Video.findOneAndDelete({ _id: videoId });

    if (!deletedVideo) {
      throw new ApiError(500, 'Video not found!');
    }

    return res
      .status(201)
      .json(new ApiResponse(201, deletedVideo, 'Video deleted successfully!'));
  } catch (err) {
    throw new ApiError(500, err?.message || 'Error deleting video!');
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { isPublished } = req.body;
  if (!videoId) {
    throw new ApiError(400, 'Video ID is required');
  }
  try {
    const video = await Video.findByIdAndUpdate(
      videoId,
      { $set: { isPublished } },
      { new: true },
    );

    if (!video) {
      throw new ApiError(500, 'Failed to toggle publish status');
    }

    return res
      .status(201)
      .json(new ApiResponse(201, video, 'Toggle publish status successfully!'));
  } catch (error) {
    throw new ApiError(500, err?.message || 'Error toggling publish status!');
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
