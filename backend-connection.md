# Connecting TedList Mobile App to MongoDB Atlas

## 1. Backend Setup Instructions

### Install Required Dependencies in Your Express Backend

```bash
# Navigate to your backend directory
cd [your-backend-directory]

# Install MongoDB related packages
npm install mongoose dotenv
```

### Create Environment Configuration

Create a `.env` file in your backend root directory:

```
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@tedlistmobile.xxxxx.mongodb.net/tedlist?retryWrites=true&w=majority

# JWT Secret Keys
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# App Configuration
PORT=5000
NODE_ENV=development
```

Replace `<username>` and `<password>` with your actual MongoDB Atlas credentials.

### Update MongoDB Connection Code

In your backend's database connection file (typically `db.js` or similar):

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options might be deprecated in newer Mongoose versions
      // If you get warnings, you can safely remove them
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## 2. Data Models

Here are the essential data models you need in your backend:

### User Model (models/User.js)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  stats: {
    trades: {
      type: Number,
      default: 0
    },
    listings: {
      type: Number,
      default: 0
    },
    xp: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
```

### Item Model (models/Item.js)

```javascript
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an item name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide an item description']
  },
  condition: {
    type: String,
    required: [true, 'Please specify item condition'],
    enum: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category']
  },
  images: [{
    type: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'traded', 'pending', 'removed'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', ItemSchema);
```

### Trade Model (models/Trade.js)

```javascript
const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  offeredItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  requestedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trade', TradeSchema);
```

### Notification Model (models/Notification.js)

```javascript
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['match', 'trade', 'system', 'admin'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  relatedTrade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
```

## 3. API Endpoints

Ensure your Express backend has these endpoints to match the client API services we created:

### Auth Routes (routes/auth.js)

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout user
router.post('/logout', protect, authController.logout);

module.exports = router;
```

### User Routes (routes/users.js)

```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Get user profile
router.get('/profile', protect, userController.getProfile);

// Update user profile
router.put('/profile', protect, userController.updateProfile);

module.exports = router;
```

### Item Routes (routes/items.js)

```javascript
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

// Get all items
router.get('/', itemController.getAllItems);

// Get user items
router.get('/user', protect, itemController.getUserItems);

// Get single item
router.get('/:id', itemController.getItemById);

// Create a new item
router.post('/', protect, itemController.createItem);

// Update item
router.put('/:id', protect, itemController.updateItem);

// Delete item
router.delete('/:id', protect, itemController.deleteItem);

module.exports = router;
```

### Trade Routes (routes/trades.js)

```javascript
const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware');

// Get all user trades
router.get('/user', protect, tradeController.getUserTrades);

// Get potential matches
router.get('/matches', protect, tradeController.getPotentialMatches);

// Create a trade
router.post('/', protect, tradeController.createTrade);

// Accept a trade
router.post('/:id/accept', protect, tradeController.acceptTrade);

// Reject a trade
router.post('/:id/reject', protect, tradeController.rejectTrade);

module.exports = router;
```

### Notification Routes (routes/notifications.js)

```javascript
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Get all notifications
router.get('/', protect, notificationController.getNotifications);

// Mark notification as read
router.post('/:id/read', protect, notificationController.markAsRead);

// Mark all notifications as read
router.post('/read-all', protect, notificationController.markAllAsRead);

module.exports = router;
```

## 4. Connecting Your Mobile App to the Backend

1. Make sure your API_BASE_URL in the mobile app's config.ts points to your backend server.
2. When testing on a physical device, use your computer's local network IP address:
   ```typescript
   export const DEV_API_URL = 'http://192.168.x.x:5000';
   ```
3. Ensure backend CORS settings allow requests from your app:
   ```javascript
   app.use(cors({
     origin: '*', // For development only. Restrict in production
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     credentials: true
   }));
   ```

## 5. Testing the Connection

1. Start your Express backend server
2. Run your React Native app
3. Try to register a new user
4. Check the MongoDB Atlas dashboard to see if the user was created
