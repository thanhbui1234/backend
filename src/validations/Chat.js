import Joi from 'joi';

// Define the Joi schema for validation
const chatValidationSchema = Joi.object({
  username: Joi.string(),
  secret: Joi.string().required(),
  email: Joi.string().email(),
  first_name: Joi.string(),
  last_name: Joi.string(),
});

export default chatValidationSchema;
