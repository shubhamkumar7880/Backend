import mongoose, { isValidObjectId } from 'mongoose';
import { Playlist } from '../models/Playlist.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '../utils/cloudinary.js';
import { Video } from '../models/Video.model.js';

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || name.trim() === '') {
    throw new ApiError(400, 'Name is required');
  }
  if (!description || description.trim() === '') {
    throw new ApiError(400, 'Description is required');
  }
  let thumbnailLocalPath;
  if (
    req?.files &&
    Array.isArray(req.files?.playlistThumbnail) &&
    req.files.playlistThumbnail.length > 0
  ) {
    if (!req.files.playlistThumbnail[0]?.mimetype.includes('image')) {
      throw new ApiError(400, 'Invalid file type');
    } else thumbnailLocalPath = req.files.playlistThumbnail[0].path;
  }
  let thumbnail = '';
  if (thumbnailLocalPath) {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  }
  const playlistModel = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    playlistThumbnail: thumbnail?.url || '',
    owner: isValidObjectId(req.user._id) ? req.user._id : null,
  });
  if (!playlistModel) {
    throw new ApiError(500, 'Failed to create playlist');
  }
  return res
    .status(201)
    .json(new ApiResponse(201, playlistModel, 'Playlist created successfully'));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user ID');
  }
  const playlists = await Playlist.find({ owner: userId });
  if (!playlists) {
    throw new ApiError(404, 'Playlists not found');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlists, 'Playlists fetched successfully'));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, 'Playlist fetched successfully'));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, 'Video already added to playlist');
  }
  if (playlist?.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      'You are not authorized to add video to this playlist',
    );
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }
  playlist.videos.push(videoId);
  await playlist.save();
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, 'Video added to playlist successfully'),
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }
  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(400, 'Video not added to playlist');
  }
  if (playlist?.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      'You are not authorized to remove video from this playlist',
    );
  }
  playlist.videos.pull(videoId);
  await playlist.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        'Video removed from playlist successfully',
      ),
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }
  if (playlist?.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      'You are not authorized to remove video from this playlist',
    );
  }
  if (playlist?.playlistThumbnail) {
    await deleteFromCloudinary(playlist.playlistThumbnail);
  }

  await playlist.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Playlist deleted successfully'));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const updateVariables = req.body || {};
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }
  const hasThumbnail =
    req?.files &&
    Array.isArray(req.files?.playlistThumbnail) &&
    req.files.playlistThumbnail.length > 0;

  if (name || description || hasThumbnail) {
    if (
      hasThumbnail &&
      !req.files.playlistThumbnail[0]?.mimetype.includes('image')
    ) {
      throw new ApiError(400, 'Thumbnail must be an image');
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, 'Playlist not found');
    }
    if (playlist?.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(
        403,
        'You are not authorized to remove video from this playlist',
      );
    }
    if (hasThumbnail) {
      if (playlist?.playlistThumbnail) {
        await deleteFromCloudinary(playlist.playlistThumbnail);
      }
      if (req.files.playlistThumbnail[0].path) {
        const thumbnail = await uploadOnCloudinary(
          req.files.playlistThumbnail[0].path,
        );
        updateVariables.playlistThumbnail = thumbnail?.url;
      }
    }
    Object.keys(updateVariables)
      .filter((item) =>
        ['name', 'description', 'playlistThumbnail'].includes(item),
      )
      .forEach((key) => {
        playlist[key] = updateVariables[key];
      });
    playlist.save();
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, 'Playlist updated successfully'));
  } else {
    throw new ApiError(400, 'Name, description or thumbnail is required');
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
