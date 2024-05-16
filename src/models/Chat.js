// Import necessary modules
import mongoose from "mongoose";
import timestamp from 'mongoose-timestamp';

const chatSchema = new mongoose.Schema({
  username: { type: String, required: false },
  secret: { type: String, required: true },
  email: { type: String, required: false },
  first_name: { type: String, required: false },
  last_name: { type: String, required: false },
  create_by: {
    type: Object,
    required: false,
  },
  id_chat:{type:Number}
});

chatSchema.plugin(timestamp);
const Chat = mongoose.model("Chat", chatSchema);

// Export the Chat model
export default Chat;
