const User = require("../models/users");
const jwt = require("jsonwebtoken");
const tokenList = {};
const verifyEmail = require("../config/verifyemail");
const resetPassEmail = require("../config/resetpassemail");
const File = require('../models/file');

exports.addUser = async (req, res, next) => {

        const user = new User(req.body);
        user
          .save()
          .then(async (result) => {
            const verifyToken = jwt.sign(
              result.toJSON(),
              process.env.VERIFY_TOKEN_KEY,
              {
                expiresIn: 60 * 30,
              }
            );
            await User.findByIdAndUpdate(result._id, {
              verify_token: verifyToken,
            });
            await verifyEmail(
              result.email,
              result.first_name,
              result.username,
              verifyToken
            );
            return res.status(201).json({
              success: true,
              msg: "Successful created new User",
              hint: "verification link sent to your email",
              data: result,
            });
          })
          .catch((error) => {
            console.error(error);
            return res.status(403).json({ err: error });
          });
};
exports.getUsers = (req, res, next) => {
  req.query.populate === "address"
    ? User.find()
        .populate("address")
        .then((data) => {
          return res.status(200).json({ success: true, data: data });
        })
        .catch((err) => {
          console.error(err);
          return res.status(403).json({ err: err });
        })
    : User.find()
        .then((data) => {
          return res.status(200).json({ success: true, data: data });
        })
        .catch((err) => {
          console.error(err);
          return res.status(403).json({ err: err });
        });
};
exports.getUserId = (req, res, next) => {
  req.query.populate === "address"
    ? User.findById(req.params.id)
        .populate("address")
        .then((data) => {
          data
            ? res.status(200).json({ success: true, data: data })
            : res.status(404).json({ success: false, data: "No User Found" });
        })
        .catch((err) => {
          console.error(err);
          return res.status(403).json({ err: err });
        })
    : User.findById(req.params.id)
        .then((data) => {
          data
            ? res.status(200).json({ success: true, data: data })
            : res.status(404).json({ success: false, data: "No User Found" });
        })
        .catch((err) => {
          console.error(err);
          return res.status(403).json({ err: err });
        });
};
exports.updateUserId = (req, res, next) => {
  const { country, city, road } = req.body.address;
  Address.find({
    country: country,
    city: city,
    road: road,
  })
    .then((data) => {
      User.findByIdAndUpdate(req.params.id, {
        ...req.body,
        address: data._id,
      })
        .then((result) => {
          return res.status(200).json({ success: true, data: result });
        })
        .catch((error) => {
          console.error(error);
          return res.status(404).json({ err: error });
        });
    })
    .catch((err) => {
      console.error(err);
      return res.status(404).json({ err: "No User Found" });
    });
};
exports.deleteUserId = (req, res, next) => {
  User.findByIdAndDelete(req.params.id)
    .then((result) => {
      return res.status(200).json({ delete: true, data: result });
    })

    .catch((err) => {
      console.error(err);
      return res.status(404).json({ err: "No User Found" });
    });
};
exports.login = (req, res, next) => {
  User.findOne(
    { $or: [{ username: req.body.login }, { email: req.body.login }] },
    (err, user) => {
      if (err) throw err;
      if (!user) {
        res.status(401).send({
          success: false,
          msg: "Authentication failed. User not found.",
        });
      } else {
        user.comparePassword(req.body.password, (err, isMatch) => {
          if (isMatch && !err) {
            const token = jwt.sign(user.toJSON(), process.env.TOKEN_KEY, {
              expiresIn: process.env.TOKEN_LIFE,
            });

            const refreshToken = jwt.sign(
              user.toJSON(),
              process.env.REFRESH_TOKEN_KEY,
              {
                expiresIn: process.env.REFRESH_TOKEN_LIFE,
              }
            );
            const response = {
              status: "Logged in",
              token: token,
              refreshToken: refreshToken,
              user: {
                username: user.username,
                _id: user._id,
              },
            };
            tokenList[refreshToken] = response;
            res.status(200).json(response);
          } else {
            console.log(err);
            res.status(401).send({
              success: false,
              msg: "Authentication failed. Wrong password.",
            });
          }
        });
      }
    }
  );
};
exports.token = (req, res, next) => {
  if (req.body.refreshToken && req.body.refreshToken in tokenList) {
    const userVerification = jwt.verify(
      req.body.refreshToken,
      process.env.REFRESH_TOKEN_KEY
    );
    console.log("userVerification", userVerification);
    User.findOne(
      {
        username: userVerification.username,
      },
      (err, user) => {
        if (err) throw err;
        if (!user) {
          res.status(401).send({
            success: false,
            msg: "Authentication failed. User not found.",
          });
        } else {
          const token = jwt.sign(user.toJSON(), process.env.TOKEN_KEY, {
            expiresIn: process.env.TOKEN_LIFE,
          });
          tokenList[req.body.refreshToken].token = token;
          res.status(200).json({ token: token });
        }
      }
    );
  } else {
    res.status(404).send("Invalid request");
  }
};

exports.requestVerify = async (req, res, next) => {
  const token = await req.headers.authorization.split(" ")[1];
  // console.log("Token : ", token);
  const decodedUser = jwt.verify(await token, process.env.TOKEN_KEY);
  // console.log(decodedUser);
  User.findById(decodedUser._id).then(async (found) => {
    const verifyToken = jwt.sign(found.toJSON(), process.env.VERIFY_TOKEN_KEY, {
      expiresIn: 60 * 60 * 30,
    });
    await User.findByIdAndUpdate(decodedUser._id, { verify_token: verifyToken })
      .then(async (data) => {
        await verifyEmail(
          data.email,
          data.first_name,
          data.username,
          verifyToken
        );
        return res.status(200).json({
          success: true,
          hint: "verification link sent to your email",
          token: verifyToken,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};
exports.verifyUser = async (req, res, next) => {
  try {
    const userVerification = jwt.verify(
      req.body.verify_token,
      process.env.VERIFY_TOKEN_KEY
    );
    if (userVerification.verified) {
      return res.status(200).json({ msg: "Already verified" });
    }
    await User.findOne({ username: req.query.username })
      .then((found) => {
        if (userVerification.exp * 1000 < Date.now()) {
          return res.status(400).json({
            err: "Verification token time out, Request for a new verification link",
          });
        } else if (req.body.verify_token === found.verify_token) {
          found.verified = true;
          found.verify_token = undefined;
          found
            .save()
            .then((data) => {
              console.log("User Verified");
              return res.status(200).send({ verified: true, data: data });
            })
  
            .catch((err) => {
              console.error(err);
              return res.status(404).json({ err: err });
            });
        } else {
          return res
            .status(400)
            .json({ error: "Something went wrong try again please" });
        }
      })
      .catch((error) => {
        console.log(error);
        return res.status(400).json({ error: error });
      });
  } catch (error) {
    return res.status(400).json({ error: error });

  }

};
exports.forgetPass = (req, res, next) => {
  User.findOne({
    $or: [{ username: req.query.login }, { email: req.query.login }],
  })
    .then((data) => {
      const resetToken = jwt.sign(data.toJSON(), process.env.VERIFY_TOKEN_KEY, {
        expiresIn: 60 * 30,
      });
      User.findByIdAndUpdate(data._id, { pass_reset_token: resetToken }).then(
        (result) => {
          verifyEmail(
            result.email,
            result.first_name,
            req.query.login,
            resetToken
          );
          return res.status(200).json({
            success: true,
            reset_token: resetToken,
            msg: "Password reset link sent to your email address",
          });
        }
      );
    })
    .catch((err) => {
      console.log(err);
      return res.status(404).json({ err: err });
    });
};
exports.resetPass = async (req, res, next) => {
  const resetVerify = jwt.verify(
    await req.query.reset_token,
    process.env.VERIFY_TOKEN_KEY
  );
  await User.findById(resetVerify._id)
    .then(async (data) => {
      if (resetVerify.exp * 1000 < Date.now()) {
        res
          .status(403)
          .json({ error: "Token expired request for password again" });
      } else if (req.query.reset_token === data.pass_reset_token) {
        data.password = req.body.password;
        data.updated_at = Date.now();
        data.pass_reset_token = undefined;
        await data
          .save()
          // const user = new Object();
          // user.password = req.body.password;
          // User.findOneAndUpdate({ _id: data._id }, user)
          //   .then((result) => {
          //     User.updateOne(
          //       { _id: data._id },
          //       {
          //         $unset: { pass_reset_token: 1 },
          //       }
          //     )
          .then((result) => {
            return res.status(200).json({
              success: true,
              data: result,
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res
          .status(403)
          .json({ error: "Something went wrong try again please" });
      }
    })
    .catch((error) => {
      console.log(error);
      return res.status(404).json({ err: error });
    });
};

exports.addUserWithProfilePicture = async (req, res, next) => {
  const url = req.protocol + '://' + req.get('host');
  const file = new File({
    name: req.file.filename,
      type: req.file.mimetype,
      fileUrl: url + '/files/' + req.file.filename,
      created_at: Date.now(),
      updated_at: Date.now()
  })
        await User.findOne({
          $or: [{ username: req.body.username }, { email: req.body.email }] 
        })
          .then(async (user) => {
            if (user) {
              return res.status(400).json({ err: "User exist" });
            }
            // create address, then create user with the id of created address
            else {
              file.save().then(
                (f) => {
                  if(f) {
                    const user = new User({ ...req.body, picture_id : f._id   });
                    user
                      .save()
                      .then(async (result) => {
                        const verifyToken = jwt.sign(
                          result.toJSON(),
                          process.env.VERIFY_TOKEN_KEY,
                          {
                            expiresIn: 60 * 30,
                          }
                        );
                        await User.findByIdAndUpdate(result._id, {
                          verify_token: verifyToken,
                        });
                        await verifyEmail(
                          result.email,
                          result.first_name,
                          result.username,
                          verifyToken
                        );
                        return res.status(201).json({
                          success: true,
                          msg: "Successful created new User",
                          hint: "verification link sent to your email",
                          data: result,
                        });
                      })
                      .catch((error) => {
                        console.error(error);
                        return res.status(403).json({ err: error });
                      });
                  }
       
                }
              ).catch(
                (error) => {
                  console.log(error);
                  res.status(400).json({
                    error: error
                  });
                }
              );
            }
          })
          .catch((err) => {
            console.error(err);
            return res.status(403).json({ err: err });
          });
 
};
