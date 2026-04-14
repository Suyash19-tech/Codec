const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Professor', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Now standard password auth
    isVerified: { type: Boolean, default: false }, // Verification status
    role: { type: String, default: 'Professor', enum: ['Professor', 'Admin'] },
    profilePic: { type: String, default: '' },
    department: { type: String, default: '' },
    designation: { type: String, default: 'Professor' },
    bio: { type: String, default: '' },
    employeeId: { type: String, default: '' },
    otp: { type: String },
    otpExpires: { type: Date }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
