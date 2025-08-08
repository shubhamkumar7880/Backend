import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
); // app.use() is a method used for middleware or configuration.

app.use(express.json({ limit: '16kb' })); // it means it is accepting json responses.
app.use(express.urlencoded({ extended: true, limit: '16kb' })); // urlencoded means url converted to special characters. Extended means we can give nested objects also.
app.use(express.static('public')); // static is used to store some files or folders. here public is a folder name.
app.use(cookieParser()); // cookieparser is used to set or access cookies(crud operation) in the browser from the server.those cookies can be read or removed by the serves only.

// routes import
import userRouter from './routes/User.routes.js';
import videoRouter from './routes/Video.routes.js';
import tweetRouter from './routes/Tweet.route.js';
import subscriptionRouter from './routes/Subscription.route.js';
import commentRouter from './routes/Comment.route.js';
import likeRouter from './routes/Like.route.js';
import playlistRouter from './routes/Playlist.route.js';

//routes declarations
app.use('/api/v1/users', userRouter); // here /users works as prefix means our url will be http://localhost:8000/api/v1/users/'route name'
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/tweets', tweetRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/likes', likeRouter);
app.use('/api/v1/playlist', playlistRouter);
app.use((err, req, res, next) => {
  res
    .status(err.statusCode ?? 500)
    .json({ error: err.message ?? 'Something went wrong' });
});

export default app;
