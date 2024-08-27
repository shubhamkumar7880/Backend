import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/Video.model.js";
import { User } from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, username, sortBy = 'createdAt', sortType = 'desc' } = req.query;
    if (!username) {
        throw new ApiError(400, "Username is required");
    }
    const user = await User.findOne({ username });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const skip = (page - 1) * limit;

   try {
     const videos = await Video.find({ owner: user._id, isPublished: true })
         .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 })  // Sorting based on the query parameters
         .skip(skip)  // Skipping documents for pagination
         .limit(parseInt(limit));  // Limiting the number of documents
 
     if (!videos) {
         throw new ApiError(404, "No videos found");
     }
     const totalVideos = await Video.countDocuments({ owner: user._id, isPublished: true });
 
     return res.status(200).json(
         new ApiResponse(200, {
             page: parseInt(page),
             limit: parseInt(limit),
             totalPages: Math.ceil(totalVideos / limit),
             totalVideos,
             videos
         }, "Videos fetched successfully")
     );
   } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong!");
   }
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!(title && description)) {
        throw new ApiError(400, "Title and description are required");
    }

    try {
        const videoLocalPath = req.files?.videoFile[0]?.path;
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
        if (!(videoLocalPath && thumbnailLocalPath)) {
            throw new ApiError(400, "Video and thumbnail file is required");
        }
        const video = await uploadOnCloudinary(videoLocalPath);
        if (!video) {
            throw new ApiError(400, "Failed to upload video");
        }
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnail) {
            throw new ApiError(400, "Failed to upload thumbnail");
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
            throw new ApiError(500, "Failed to create video");
        }

        return res.status(201).json(
            new ApiResponse(201, videoModel, "Video created successfully")
        );
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong!");
    }

});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId){
        throw new ApiError(400, "Video ID is required");
    }
    try {
        const video = await Video.findById(videoId);
        if(!video){
            throw new ApiError(404, "Video not found");
        }
        return res.status(201).json(
            new ApiResponse(201, video, "Video fetched successfully!")
        );
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong!");
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail

});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};