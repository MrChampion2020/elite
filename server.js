const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const { ObjectId } = mongoose.Types;
const User = require("./models/User");
const Coupon = require("./models/Coupon");
const Vendor = require("./models/Vendor");
const Admin = require("./models/Admin");
const Task = require('./models/Tasks');

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

// Serve registration page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, './', 'register.html'));
});

// Serve registration page
app.get('/register-vendor', (req, res) => {
  res.sendFile(path.join(__dirname, './', 'vendordash.html'));
});

const generateSecretKey = () => crypto.randomBytes(32).toString("hex");
const secretKey = process.env.SECRET_KEY || generateSecretKey();

mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.log("Error connecting to MongoDB:", error));


  const API_URL = process.env.API_URL;

//user

  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };


  // Middleware to authenticate admin token
  const authenticateAdminToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, secretKey, (err, admin) => {
      if (err) return res.sendStatus(403);
      req.admin = admin;
      next();
    });
  };

  const authenticateAdmin = async (req, res, next) => {
    const token = req.headers['authorization'];
  
    if (!token) {
      return res.status(403).json({ message: 'No token provided' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({ message: 'Admin not found' });
      }
  
      req.admin = admin;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Failed to authenticate token', error });
    }
  };

  
// Middleware for authenticating vendor token
const authenticateVendorToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.vendor = user;
    next();
  });
};



/*
// Create a new task
app.post('/admin/create-task', async (req, res) => {
  try {
      const { taskId, taskName, description, link, type, userIds } = req.body;
      const newTask = new Task({ taskId, taskName, description, link, type, userIds });

      await newTask.save();

      // Assign task to selected users
      await User.updateMany(
          { _id: { $in: userIds } },
          { $push: { tasks: newTask._id } }
      );

      res.status(201).json({ message: 'Task created and assigned to users' });
  } catch (error) {
      res.status(500).json({ message: 'Error creating task', error });
  }
});

*/

// Fetch all tasks
app.get('/tasks', authenticateAdmin, async (req, res) => {
  try {
    const tasks = await Task.find().populate('users');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
});





app.get('/admin/tasks', async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});


/*
app.get('/user/tasks', authenticateToken, async (req, res) => {
  try {
      const userId = req.user._id;
      const tasks = await Task.find({ userIds: userId });

      if (tasks.length === 0) {
          return res.status(404).json({ message: 'No tasks found yet, always check for updated daily tasks' });
      }

      res.json(tasks);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching tasks', error });
  }
});
*/
// Mark task as completed
app.post('/admin/complete-task/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const task = await Task.findById(taskId);

  if (task) {
    task.status = 'completed';
    await task.save();
    res.json({ message: 'Task marked as completed' });
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});


/*
// Protected route example

app.post('/user/complete-task/:taskId', async (req, res) => {
  try {
      const { taskId } = req.params;
      const userId = req.user._id;

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const taskIndex = user.tasks.indexOf(taskId);
      if (taskIndex > -1) {
          user.tasks.splice(taskIndex, 1);
          user.elitewallet += 0.2;
          await user.save();
          return res.status(200).json({ message: 'Task completed and user rewarded' });
      } else {
          return res.status(404).json({ message: 'Task not found for user' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Error completing task', error });
  }
});



// Fetch tasks for authenticated user
app.get('/user/tasks', authenticateToken, async (req, res) => {
  try {
      const userId = req.user._id;
      const tasks = await Task.find({ userIds: userId });

      if (tasks.length === 0) {
          return res.status(404).json({ message: 'No tasks found yet, always check for updated daily tasks' });
      }

      res.json(tasks);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching tasks', error });
  }
});

// Mark task as completed and update user's elitewallet
app.post('/user/complete-task/:taskId', authenticateToken, async (req, res) => {
  try {
      const { taskId } = req.params;
      const userId = req.user._id;

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const taskIndex = user.tasks.indexOf(taskId);
      if (taskIndex > -1) {
          user.tasks.splice(taskIndex, 1);
          user.elitewallet += 0.2;
          await user.save();

          // Mark task as completed
          const task = await Task.findById(taskId);
          task.status = 'completed';
          await task.save();

          return res.status(200).json({ message: 'Task completed and user rewarded' });
      } else {
          return res.status(404).json({ message: 'Task not found for user' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Error completing task', error });
  }
});



// Create a new task and assign to users
app.post('/admin/create-task', async (req, res) => {
  try {
    const { taskId, taskName, description, link, type, userIds } = req.body;
    const newTask = new Task({ taskId, taskName, description, link, type, userIds });

    await newTask.save();

    // Assign task to selected users
    await User.updateMany(
      { _id: { $in: userIds } },
      {
        $push: {
          tasks: {
            taskId: newTask._id,
            taskName,
            description,
            link,
            type,
            assignedAt: new Date(),
          },
        },
      }
    );

    res.status(201).json({ message: 'Task created and assigned to users' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error });
  }
});*/


// Create a new task and assign to users

app.post('/admin/create-task', async (req, res) => {
  try {
    const { taskName, description, link, type, userIds } = req.body;

    // Validate userIds
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    // Create and save the new task
    const newTask = new Task({ taskName, description, link, type });
    await newTask.save();
    console.log('Task saved:', newTask);

    // Assign task to selected users
    const updateResult = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $push: {
          tasks: {
            taskId: newTask._id,
            taskName,
            description,
            link,
            type,
            assignedAt: new Date(),
          },
        },
      }
    );

    console.log('Users updated:', updateResult);

    res.status(201).json({ message: 'Task created and assigned to users' });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error });
  }
});


/*
const MAX_RETRY_COUNT = 3; // Maximum number of retries for transient errors


app.post('/admin/create-task', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskName, description, link, type, userIds } = req.body;

    // Validate userIds
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    // Create a new task
    const newTask = new Task({ taskName, description, link, type });

    // Save the task outside the retry loop to ensure it's only saved once
    await newTask.save({ session });
    console.log('Task saved:', newTask);

    let updateResult;
    let retryCount = 0;
    let success = false;

    while (retryCount < MAX_RETRY_COUNT && !success) {
      try {
        // Assign task to selected users
        updateResult = await User.updateMany(
          { _id: { $in: userIds } },
          {
            $push: {
              tasks: {
                taskId: newTask._id,
                taskName,
                description,
                link,
                type,
                assignedAt: new Date(),
              },
            },
          },
          { session }
        );

        console.log('Users updated:', updateResult);

        // Check if any users were actually updated
        if (updateResult.modifiedCount === 0) {
          console.warn('No users were updated. Check if the userIds are correct.');
          await session.abortTransaction();
          return res.status(404).json({ message: 'No users found to update' });
        }

        success = true;
      } catch (error) {
        if (error.errorLabels && error.errorLabels.includes('TransientTransactionError')) {
          console.warn('TransientTransactionError detected, retrying...', retryCount + 1);
          retryCount++;
        } else {
          throw error;
        }
      }
    }

    if (!success) {
      await session.abortTransaction();
      return res.status(500).json({ message: 'Failed to update users after multiple retries' });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Task created and assigned to users' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error });
  }
});*/


/*
app.post('/admin/create-task', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { taskName, description, link, type, userIds } = req.body;

    // Validate userIds
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    // Create a new task
    const newTask = new Task({ taskName, description, link, type });
    await newTask.save({ session });
    console.log('Task saved:', newTask);

    // Assign task to selected users
    const updateResult = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $push: {
          tasks: {
            taskId: newTask._id,
            taskName,
            description,
            link,
            type,
            assignedAt: new Date(),
          },
        },
      },
      { session }
    );

    console.log('Users updated:', updateResult);

    // Check if any users were actually updated
    if (updateResult.modifiedCount === 0) {
      console.warn('No users were updated. Check if the userIds are correct.');
      await session.abortTransaction();
      return res.status(404).json({ message: 'No users found to update' });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Task created and assigned to users' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error });
  }
});


app.post('/admin/create-task', async (req, res) => {
  try {
    const { taskId, taskName, description, link, type, userIds } = req.body;
    const newTask = new Task({ taskId, taskName, description, link, type, userIds });

    await newTask.save();
    console.log('Task saved:', newTask);

    // Assign task to selected users
    const updateResult = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $push: {
          tasks: {
            taskId: newTask._id,
            taskName,
            description,
            link,
            type,
            assignedAt: new Date(),
          },
        },
      }
    );
    console.log('Users updated:', updateResult);

    res.status(201).json({ message: 'Task created and assigned to users' });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error });
  }
});
*/

// Fetch tasks for authenticated user
app.get('/user/tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user || user.tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found yet, always check for updated daily tasks' });
    }

    res.json(user.tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
});

// Mark task as completed and update user's elitewallet
app.post('/user/complete-task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const taskIndex = user.tasks.findIndex(task => task.taskId.equals(taskId));
    if (taskIndex > -1) {
      user.tasks.splice(taskIndex, 1);
      user.eliteWallet += 0.2;
      await user.save();

      // Mark task as completed
      const task = await Task.findById(taskId);
      task.status = 'completed';
      await task.save();

      return res.status(200).json({ message: 'Task completed and user rewarded' });
    } else {
      return res.status(404).json({ message: 'Task not found for user' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error completing task', error });
  }
});


/*
// Schedule a job to check for tasks assigned for more than 24 hours
cron.schedule('* * * * *', async () => {
  try {
    const users = await User.find();

    users.forEach(async user => {
      const currentTime = new Date();
      user.tasks = user.tasks.filter(async task => {
        const taskAge = currentTime - new Date(task.assignedAt);
        if (taskAge > 24 * 60 * 60 * 1000) {
          // Task is older than 24 hours, mark it as completed and reward user
          user.elitewallet += 0.2;

          const dbTask = await Task.findById(task.taskId);
          if (dbTask) {
            dbTask.status = 'completed';
            await dbTask.save();
          }

          return false; // Remove task from user's task list
        }
        return true; // Keep task in user's task list
      });
      await user.save();
    });
  } catch (error) {
    console.error('Error in scheduled task:', error);
  }
});*/
/*
// Middleware for authenticating user token
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}*/



  //User Endpoints

const generateCouponCode = () => crypto.randomBytes(4).toString("hex");

app.post('/generate-coupon', async (req, res) => {
  try {
    const { value, currency } = req.body;
    const newCoupon = new Coupon({
      code: generateCouponCode(),
      value,
      currency,
    });

    await newCoupon.save();
    res.status(200).json({ message: 'Coupon generated successfully', coupon: newCoupon });
  } catch (error) {
    console.error('Error generating coupon:', error);
    res.status(500).json({ message: 'Failed to generate coupon' });
  }
});



app.post('/mark-coupon-used', async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code });
    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive coupon code' });
    }
    
    coupon.isUsed = true;
    coupon.isActive = false;
    await coupon.save();
    res.status(200).json({ message: 'Coupon marked as used' });
  } catch (error) {
    console.error('Error marking coupon as used:', error);
    res.status(500).json({ message: 'Failed to mark coupon as used' });
  }
});


app.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ message: 'Failed to fetch coupons' });
  }
});



const sendVerificationEmail = async (email, verificationToken) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const API_URL = process.env.API_URL;
  const mailOptions = {
    from: "Elitearn",
    to: email,
    subject: "Email Verification",
    html: `<p>Please click on the following link to verify your email: <a href="${API_URL}/verify/${verificationToken}">${API_URL}/verify/${verificationToken}</a></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error sending the verification email:", error);
  }
};


app.post(`${API_URL}/reset-password/request`, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email does not exist' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetToken = hashedToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${API_URL}/reset-password?token=${resetToken}&email=${email}`;

    const mailOption = {
      from: 'Elitearn',
      to: email,
      subject: 'Password Reset',
      text: `You requested a password reset. Please use the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOption);

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post(`${API_URL}/reset-password`, async (req, res) => {
  const { token, email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }

    const isTokenValid = await bcrypt.compare(token, user.resetToken);

    if (!isTokenValid || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



//user referral bonus
const distributeReferralBonusUser = async (userId, userLevel, vendorLevel) => {
  if (userLevel <= 0 && vendorLevel <= 0) return;

  const user = await User.findById(userId).populate('referredBy');
  if (user && user.referredBy) {
    const referrer = user.referredBy;
    let bonusAmount;

    if (userLevel > 0) {
      switch (userLevel) {
        case 1:
          bonusAmount = 100;
          referrer.wallet += bonusAmount;
          break;
        case 2:
          bonusAmount = 200;
          referrer.wallet += bonusAmount;
          break;
        case 3:
          bonusAmount = 0;
          referrer.wallet += bonusAmount;
          break;
      }

      await referrer.save();
      await distributeReferralBonusUser(referrer._id, userLevel - 1, vendorLevel);
    }
  } else {
    const vendor = await Vendor.findById(userId).populate('referredBy');
    if (vendor && vendor.referredBy) {
      const vendorReferrer = vendor.referredBy;
      let vendorBonusAmount;

      if (vendorLevel > 0) {
        switch (vendorLevel) {
          case 1:
            vendorBonusAmount = 4000;
            vendorReferrer.wallet += vendorBonusAmount;
            break;
          case 2:
            vendorBonusAmount = 200;
            vendorReferrer.wallet += vendorBonusAmount;
            break;
          case 3:
            vendorBonusAmount = 100;
            vendorReferrer.wallet += vendorBonusAmount;
            break;
        }

        await vendorReferrer.save();
        await distributeReferralBonusUser(vendorReferrer._id, userLevel, vendorLevel - 1);
      }
    }
  }
};




const distributeReferralBonusVendor = async (vendorId, vendorLevel) => {
  if (vendorLevel <= 0) return;

  try {
    const vendor = await Vendor.findById(vendorId).populate('referredBy');
    if (vendor && vendor.referredBy) {
      const vendorReferrer = vendor.referredBy;
      let vendorBonusAmount = 0;

      switch (vendorLevel) {
        case 1:
          vendorBonusAmount = 4000;
          break;
        case 2:
          vendorBonusAmount = 200;
          break;
        case 3:
          vendorBonusAmount = 100;
          break;
      }

      vendorReferrer.wallet = (parseFloat(vendorReferrer.wallet) + vendorBonusAmount).toString();
      await vendorReferrer.save();
      console.log(`Added ${vendorBonusAmount} to ${vendorReferrer.username}'s wallet`);

      await distributeReferralBonusVendor(vendorReferrer._id, vendorLevel - 1);
    }
  } catch (error) {
    console.error("Error distributing referral bonus:", error);
  }
};

app.post("/register-vendor", async (req, res) => {
  try {
    const { fullName, email, phone, password, username, companyName, couponCode, companyAddress, referralLink, accountType = 'naira' } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingUsername = await Vendor.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon || !coupon.isActive || coupon.isUsed) {
      return res.status(400).json({ message: "Invalid or inactive coupon code" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newVendor = new Vendor({
      fullName,
      email,
      phone,
      password: hashedPassword,
      username,
      companyName,
      couponCode,
      companyAddress,
      accountType,
      referralLink: `${process.env.API_URL}/register-vendor?ref=${username}`,
      active: false,
    });

    if (referralLink) {
      const referrer = await User.findOne({ username: referralLink }) || await Vendor.findOne({ username: referralLink });
      if (referrer && referrer.referralLinkActive) {
        newVendor.referredBy = referrer._id;
        if (!referrer.referrals) referrer.referrals = [];
        referrer.referrals.push(newVendor._id);

        // Credit referrer's wallet
        const amountToCredit = referrer.accountType === 'naira' ? 4000 : 4;
        referrer.wallet = (parseFloat(referrer.wallet) + amountToCredit).toString();
        await referrer.save();
        console.log(`Credited ${amountToCredit} to referrer ${referrer.username}`);
      } else {
        return res.status(400).json({ message: "Invalid or inactive referral link" });
      }
    }

    await newVendor.save();
    await sendVerificationEmail(newVendor.email, newVendor.verificationToken);

    // Mark coupon as used
    coupon.isUsed = true;
    coupon.isActive = false;
    coupon.usedBy = { email: newVendor.email, username: newVendor.username, phone: newVendor.phone };
    await coupon.save();

    // Distribute referral bonuses
    await distributeReferralBonusVendor(newVendor._id, 3); // Assuming 3 levels of referral bonus for vendors

    res.status(200).json({ message: "Vendor registered successfully", vendorId: newVendor._id });
  } catch (error) {
    console.error("Error registering vendor:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate key error", error: error.message });
    }
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, username, referralLink, couponCode, accountType = 'naira' } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon || !coupon.isActive || coupon.isUsed) {
      return res.status(400).json({ message: "Invalid or inactive coupon code" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      username,
      verificationToken: crypto.randomBytes(20).toString("hex"),
      accountType
    });

    // Generate referral link
    newUser.referralLink = `${process.env.API_URL}/register?ref=${username}`;

    if (referralLink) {
      const referrer = await User.findOne({ username: referralLink }) || await Vendor.findOne({ username: referralLink });
      if (referrer && referrer.referralLinkActive) {
        newUser.referredBy = referrer._id;
        referrer.referrals.push(newUser._id);

        // Credit referrer's wallet
        const amountToCredit = referrer.accountType === 'naira' ? 4000 : 4;
        referrer.wallet += amountToCredit;
        await referrer.save();
      } else {
        return res.status(400).json({ message: "Invalid or inactive referral link" });
      }
    }

    await newUser.save();
    await sendVerificationEmail(newUser.email, newUser.verificationToken);

    // Mark coupon as used
    coupon.isUsed = true;
    coupon.isActive = false;
    coupon.usedBy = { email: newUser.email, username: newUser.username, phone: newUser.phone };
    await coupon.save();

    // Distribute referral bonuses
    await distributeReferralBonusUser(newUser._id, 3, 3); // Assuming 3 levels of referral bonus for both user and vendor

    res.status(200).json({ message: "User registered successfully", userId: newUser._id });
  } catch (error) {
    console.log("Error registering user:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate key error", error: error.message });
    }
    res.status(500).json({ message: "Registration failed" });
  }
});


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, './')));



app.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.log("Error verifying email:", error);
    res.status(500).json({ message: "Email verification failed" });
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const now = new Date();
    const lastLogin = user.lastLogin || new Date(0);
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

    if (now - lastLogin >= oneDayInMilliseconds) {
      user.referralWallet += 250;
      user.lastLogin = now;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.log("Error logging in user:", error);
    res.status(500).json({ message: "Login failed" });
  }
});



app.get("/user-details", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        phone: user.phone,
        wallet: user.wallet,
        referralWallet: user.referralWallet,
        eliteWallet: user.eliteWallet,
        referrals: user.referrals,
        referralLink: user.referralLink,
      }
    });
  } catch (error) {
    console.log("Error fetching user details:", error);
    res.status(500).json({ message: "Error fetching user details", error });
  }
});




// Spin endpoint
app.post('/spin', authenticateToken, async (req, res) => {
  const { userId } = req.user; // Assuming you have middleware to attach userId to req.user
  const user = await User.findById(userId);

  // Check last spin time
  const now = new Date();
  if (user.lastSpin && (now - user.lastSpin) < 24 * 60 * 60 * 1000) {
    return res.status(403).json({ message: 'You can only spin the wheel once every 24 hours.' });
  }

  // Mocked logic to select a random reward
  const segments = [0, 1, 5, 8, 10, 50, 20, 100, 150, 250, 500, 350, 25, 430, 400, 380, 450];
  const randomIndex = Math.floor(Math.random() * segments.length);
  const amount = segments[randomIndex];

  // Update user's referralWallet
  user.referralWallet += amount;
  user.lastSpin = now;
  await user.save();

  res.json({ referralWallet: user.referralWallet });
});


//Admin Endpoints


// Manually add admin user (one-time operation)
const addAdminUser = async () => {
  try {
    const admin = new Admin({
      fullName: 'Edith Akporero',
      phone: '9030155327',
      username: 'Admin',
      email: 'akporeroedith96@gmail.com',
      password: 'Admin.1234',
    });
    await admin.save();
    console.log("Admin user created");
  } catch (error) {
    console.log("Error creating admin user:", error);
  }
};

// Uncomment the following line and run the server once to add the admin user

//addAdminUser();



// Admin login endpoint
app.post("/login/admin", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const admin = await Admin.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
    });

    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(401).json({ message: "Invalid username or email or password" });
    }

    const token = jwt.sign({ adminId: admin._id, role: 'admin' }, secretKey, { expiresIn: '1h' });

    res.status(200).json({ message: "Admin login successful", token });
  } catch (error) {
    console.log("Error logging in admin:", error);
    res.status(500).json({ message: "Admin login failed" });
  }
});




// Example of a protected admin route
app.get('/admin/protected', authenticateAdminToken, (req, res) => {
  res.status(200).json({ message: 'This is a protected admin route' });
});




app.get("/admin-details", authenticateAdminToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      admin: {
        fullName: admin.fullName,
        email: admin.email,
      }
    });
  } catch (error) {
    console.log("Error fetching admin details:", error);
    res.status(500).json({ message: "Error fetching admin details", error });
  }
});


// Endpoint to get the number of users
app.get('/admin/user-count', authenticateAdminToken, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({ userCount });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ message: 'Failed to fetch user count' });
  }
});

// Endpoint to fetch user details
app.get('/admin/users', authenticateAdminToken, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});



// Endpoint to get the last 10 registered users
app.get('/admin/user', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});




// Route to get vendor details
app.get('/vendor/details', authenticateVendorToken, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(200).json(vendor);
  } catch (error) {
    console.log('Error fetching vendor details:', error);
    res.status(500).json({ message: 'Failed to fetch vendor details' });
  }
});


// Controller to set vendor status
const setVendorStatus = async (req, res) => {
  const { vendorId } = req.params;
  const { status } = req.body;

  if (typeof vendorId === 'undefined' || typeof status === 'undefined') {
      return res.status(400).json({ message: 'Vendor ID and status are required.' });
  }

  try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
          return res.status(404).json({ message: 'Vendor not found.' });
      }

      vendor.active = status;
      await vendor.save();

      res.status(200).json({ message: 'Vendor status updated successfully.' });
  } catch (error) {
      res.status(500).json({ message: 'Error updating vendor status.', error });
  }
};



// Endpoint to get the number of vendors
app.get('/admin/vendor-count', authenticateAdminToken, async (req, res) => {
  try {
    const vendorCount = await Vendor.countDocuments();
    res.status(200).json({ vendorCount });
  } catch (error) {
    console.error('Error fetching vendor count:', error);
    res.status(500).json({ message: 'Failed to fetch vendor count' });
  }
});

// Endpoint to fetch vendor details
app.get('/admin/vendors', authenticateAdminToken, async (req, res) => {
  try {
    const vendors = await Vendor.find({}, { password: 0 }); // Exclude password field
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Failed to fetch vendors' });
  }
});

// Endpoint to get the last 10 registered vendors
app.get('/admin/vendor', authenticateAdminToken, async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 }).limit(10);
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error });
  }
});


// Endpoint to set vendor active status
app.patch('/admin/vendors/:vendorId/status', authenticateToken, setVendorStatus);



app.post('/vendor-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const vendorDetails = {
      username: vendor.username,
      wallet: vendor.wallet,
      fullName: vendor.fullName,
      email: vendor.email,
      phone: vendor.phone,
      companyName: vendor.companyName,
      companyAddress: vendor.companyAddress,
      referralLink: vendor.referralLink,
      referredBy: vendor.referredBy
    };
    res.json({ token, vendorDetails });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



app.get('/vendor-details', authenticateVendorToken, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendorDetails = {
      username: vendor.username,
      wallet: vendor.wallet,
      fullName: vendor.fullName,
      email: vendor.email,
      phone: vendor.phone,
      companyName: vendor.companyName,
      companyAddress: vendor.companyAddress,
      referralLink: vendor.referralLink,
      referredBy: vendor.referredBy
    };

    res.json(vendorDetails);
  } catch (error) {
    console.error('Error fetching vendor details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




app.get('/vendor-referrals', authenticateVendorToken, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    const referrals = await User.find({ referrer: vendor._id });
    res.status(200).json(referrals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching referral users' });
  }
});

// Check coupon endpoint
app.post('/check-coupon', authenticateVendorToken, async (req, res) => {
  try {
    const { couponCode } = req.body;
    const coupon = await Coupon.findOne({ code: couponCode, vendor: req.vendor.userId });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const isActive = coupon.active;
    coupon.checkedByVendor.push(req.vendor.userId);
    await coupon.save();

    res.json({ isActive, coupon });
  } catch (err) {
    console.error('Error checking coupon:', err);
    res.status(500).json({ message: 'Error checking coupon' });
  }
});

// Get all checked coupons by vendor
app.post('/checked-coupons', authenticateVendorToken, async (req, res) => {
  try {
    const coupons = await Coupon.find({ checkedByVendor: req.vendor.userId });
    res.json(coupons);
  } catch (err) {
    console.error('Error fetching checked coupons:', err);
    res.status(500).json({ message: 'Error fetching checked coupons' });
  }
});

// Get users who used vendor's coupons
app.post('/coupon-users', authenticateVendorToken, async (req, res) => {
  try {
    const users = await User.find({ 'usedCoupons.vendor': req.vendor.userId });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Example of a protected vendor route
app.get('/vendor/protected', authenticateVendorToken, (req, res) => {
  res.status(200).json({ message: 'This is a protected vendor route' });
});



// Endpoint to fetch top earners within the last 48 hours
app.get('/top-earners', authenticateToken, async (req, res) => {
  try {
      const now = new Date();
      const past48Hours = new Date(now - 48 * 60 * 60 * 1000); // 48 hours ago

      // Assuming you have a timestamp field 'lastEarningUpdate' to track the latest earnings update
      const users = await User.aggregate([
          {
              $match: {
                  lastEarningUpdate: { $gte: past48Hours } // Adjust this field name according to your schema
              }
          },
          {
              $project: {
                  username: 1,
                  totalEarnings: {
                      $sum: ["$wallet", "$referralWallet", "$eliteWallet"]
                  }
              }
          },
          {
              $sort: { totalEarnings: -1 }
          }
      ]).limit(10); // Fetch top 10 earners

      res.json(users);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching top earners', error });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

