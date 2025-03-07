import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document {
  seq: number;
}

const CounterSchema: Schema = new Schema({
  seq: { type: Number, default: 0 },
});

export default mongoose.model<ICounter>("Counter", CounterSchema);