import Joi from "joi";

export const commentValidate = Joi.object({
    shoeId: Joi.string().required().messages({
      "any.required": 'Trường shoeId là bắt buộc'
    }),
    rating: Joi.number().min(1).max(5).messages({
      "number.min": 'Trường rating phải lớn hơn hoặc bằng 1',
      "number.max": 'Trường rating phải nhỏ hơn hoặc bằng 5',
    }),
    content: Joi.string().required().messages({
      "string.empty": 'Trường content không được để trống',
      "any.required": 'Trường content là bắt buộc'
    }),
    images: Joi.object({
      url: Joi.string().required(),
      publicId: Joi.string().required()
    })
  });
  

export const updateCommentValidate = Joi.object({
    commentId: Joi.string().required().messages({
        "any.required": 'Trường shoeId là bắt buộc'
    }),
    
    content: Joi.string().required().messages({
        "string.empty": 'Trường comment không được để trống',
        "any.required": 'Trường comment là bắt buộc'
    }),
    rating: Joi.number().min(1).max(5).required().messages({
        "number.min": 'Trường rating phải lớn hơn hoặc bằng 1',
        "number.max": 'Trường rating phải nhỏ hơn hoặc bằng 5',
        "any.required": 'Trường rating là bắt buộc'
      }),
    // image: Joi.string().required().messages({
    //     "string.empty": 'Trường image không được để trống',
    //     "any.required": 'Trường image là bắt buộc'
    // }),
})

