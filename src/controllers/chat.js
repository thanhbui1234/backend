import axios from 'axios';
import chatValidationSchema from '../validations/Chat';
import Chat from '../models/Chat';
import User from '../models/User';

const CHAT_ENGINE_PRIVATE_KEY = '53a15f64-37ee-428a-ae06-2644fbec9780';
const CHAT_ENGINE_PROJECT_ID = '086d50c6-5443-438c-8766-cfd20e37e71e';

async function registerChatUser(username, secret, email, first_name, last_name, create_by) {
    // Validate dữ liệu đầu vào
    const { error } = chatValidationSchema.validate({ username, secret, email, first_name, last_name });
    if (error) throw new Error(error.details[0].message);

    try {
        const response = await axios.post(
            'https://api.chatengine.io/users/',
            { username, secret, email, first_name, last_name },
            { headers: { 'Private-Key': CHAT_ENGINE_PRIVATE_KEY } }
        );

        // Lấy ID của người tạo từ bảng User
        const createdByUser = await User.findById(create_by);

        // Lưu thông tin người dùng vào cơ sở dữ liệu
        const newUser = new Chat({ 
            id_chat: response.data.id, // Lưu id_chat từ phản hồi của ChatEngine
            username, 
            secret, 
            email, 
            first_name, 
            last_name, 
            create_by: { 
                _id: createdByUser._id, 
                userName: createdByUser.userName, 
                email: createdByUser.email 
            } 
        });
        await newUser.save();

        return response.data;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message === "This username is taken.") {
            throw new Error("Tên người dùng đã được sử dụng. Vui lòng chọn một tên khác.");
        } else {
            throw new Error("Đã xảy ra lỗi khi đăng ký tài khoản.");
        }
    }
}


async function loginChatUser(username, secret) {
    // Validate dữ liệu đầu vào
    const { error } = chatValidationSchema.validate({ username, secret });
    if (error) throw new Error(error.details[0].message);

    try {
        const response = await axios.get('https://api.chatengine.io/users/me/', {
            headers: {
                'Project-ID': CHAT_ENGINE_PROJECT_ID,
                'User-Name': username,
                'User-Secret': secret,
            },
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message === "Authentication failed.") {
            throw new Error("Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại tên người dùng và mật khẩu.");
        } else {
            throw new Error("Đã xảy ra lỗi khi đăng nhập.");
        }
    }
}

async function getAllChatUsers() {
    try {
        const response = await axios.get('https://api.chatengine.io/users/', {
            headers: { 'Private-Key': CHAT_ENGINE_PRIVATE_KEY }
        });
        return response.data;
    } catch (error) {
        throw new Error('Đã xảy ra lỗi khi lấy danh sách người dùng.');
    }
}

async function deleteChatUser(userId) {
    try {
        // Xóa người dùng từ dịch vụ chatengine
        const response = await axios.delete(`https://api.chatengine.io/users/${userId}/`, {
            headers: { 'Private-Key': CHAT_ENGINE_PRIVATE_KEY }
        });

        // Kiểm tra xác nhận xóa thành công từ dịch vụ chatengine
        if (response.status !== 200) {
            throw new Error(`Lỗi khi xóa người dùng ${userId} từ dịch vụ chatengine: ${response.statusText}`);
        }

        // Xóa người dùng từ cơ sở dữ liệu local
        const deletedUser = await Chat.findOneAndDelete({ id_chat: userId });
        if (!deletedUser) {
            throw new Error('Không tìm thấy người dùng để xóa trong cơ sở dữ liệu.');
        }

        return response.data;
    } catch (error) {
        throw new Error('Đã xảy ra lỗi khi xóa người dùng.');
    }
}

async function getUserChatByEmail(email) {
    try {
        // Tìm kiếm user trong bảng Chat dựa trên email của trường create_by
        const userChat = await Chat.findOne({ 'create_by.email': email });
        if (!userChat) {
            throw new Error('Không tìm thấy userChat.');
        }
        return userChat;
    } catch (error) {
        throw new Error(`Đã xảy ra lỗi khi lấy userChat: ${error.message}`);
    }
}



// Export các hàm để có thể sử dụng ở nơi khác trong mã của bạn
export { registerChatUser, loginChatUser,getAllChatUsers, deleteChatUser,getUserChatByEmail };
