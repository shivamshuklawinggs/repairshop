import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITokenDocument extends Document {
  userId: Types.ObjectId;
  token: string;
  type: 'access' | 'refresh';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tokenSchema: Schema<ITokenDocument> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['access', 'refresh'],
      required: [true, 'Token type is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true,
      // TTL index: MongoDB will automatically delete documents 0 seconds after expiresAt
      expires: 0,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Compound index for userId and token type
tokenSchema.index({ userId: 1, type: 1 });

const Token = mongoose.model<ITokenDocument>('Token', tokenSchema);

export default Token;
