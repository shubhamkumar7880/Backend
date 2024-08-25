This is a backend project.

Notes:-

In Express.js, middleware refers to functions that have access to the request object (req), the response object (res), and the next middleware function in the application's request-response cycle. Middleware functions can perform various tasks such as:

Executing code.
Modifying request and response objects.
Terminating the request-response cycle.
Calling the next middleware function in the stack.
Middleware functions are crucial in Express.js for tasks like request processing, authentication, logging, error handling, etc. They are added to the application's request-response pipeline using the app.use() method or specific HTTP verb methods like app.get(), app.post(), etc.

example:

const express = require('express');
const app = express();

// Middleware function
app.use(function(req, res, next) {
  console.log('A request was made to the server.');
  next(); // Calling next() passes control to the next middleware function
});

// Route handler
app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.listen(3000, function() {
  console.log('Server is running on port 3000');
});

In this example, the middleware function logs a message whenever a request is made to the server before passing control to the route handler. Middleware functions can be chained together, and the order in which they are defined determines the order in which they are executed in the request-response cycle.


if we write app.get('/users', function(req, res) {}), means we are not exporting the routes. but when we export the routes and import them for handling routes, then, in this case, we need to use the middleware.
So, we write app.use('/users', userRouter);
So, when someone will write /users, then, it will give control to the userRouter.

we can extract json data from req.body.

Access tokens and refresh tokens are both integral parts of the OAuth 2.0 protocol, but they serve different purposes in the context of authentication and authorization:

1. **Access Token**:
   - An access token is a credential used to access protected resources on behalf of the user.
   - It is a short-lived token that grants access to specific resources or APIs.
   - Access tokens are typically included in HTTP headers of API requests as a means of authentication.
   - They contain information about the permissions granted to the client application and the user.
   - Access tokens are usually scoped, meaning they are only valid for a specific set of resources or actions.

2. **Refresh Token**:
   - A refresh token is a credential used to obtain a new access token after the current access token expires.
   - It is long-lived compared to the access token, typically lasting for days or even months.
   - Refresh tokens are securely stored by the client application and are used to obtain new access tokens without requiring the user to re-authenticate.
   - They are not meant to be included in API requests; instead, they are exchanged for a new access token through a token refresh request.
   - Refresh tokens are valuable targets for attackers because they can be used to obtain fresh access tokens without the user's involvement.

In summary, access tokens are short-lived credentials used to access resources, while refresh tokens are long-lived credentials used to obtain new access tokens without re-authentication.

Aggregation pipeline

- The $lookup stage in MongoDB's aggregation pipeline allows you to perform a left outer join between documents in the current     collection and documents in another (or the same) collection. This stage enables you to combine related documents from different collections based on a common field.
- from: The name of the collection you want to join with (referred to as the "foreign" collection). This value will be in lowercase and always in plural form.
- localField: The field from the input (current) collection that will be compared to the foreignField.
- foreignField: The field from the from collection that will be compared to the localField.
- as: The name of the new array field that will hold the matched documents from the from collection.
- the returned data structure is array. to return different data structure, we use $addFileds.
 example:-

 [
  {
    $lookup: {
      from: "authors",
      localFiled: "author_id",
      foreignFiled: "_id",
      as: "author_details" 
    }
  },
  {
    $addFields: {
      author_details: {
        $arrayElement: ["$author_details", 0]  //this will return first element of author_details array.
      }
    }
  }
 ]

- In MongoDB, the $match stage is a part of the aggregation pipeline that filters the documents to pass only those that match specified conditions to the next stage in the pipeline. It functions similarly to the find() operation but within the context of the aggregation pipeline, allowing you to filter data before performing more complex transformations.

- The $addFields stage in MongoDB's aggregation pipeline is used to add new fields to documents or to modify existing fields by computing new values. Unlike $project, which can also reshape documents by including or excluding fields, $addFields focuses on adding fields without altering the other fields in the document.

- The $project stage in MongoDB's aggregation pipeline is used to include, exclude, or transform fields in the documents that pass through the pipeline. It allows you to shape the output by specifying which fields should be included in the result, as well as performing computations and renaming fields.