// Import Firebase SDK
import { getDatabase, ref, push, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { app } from "./firebase-config.js";
import { currentRoomId, loadRoomsFromDatabase } from "./room.js";
import { auth } from "./info.js";

// Initialize the database
const database = getDatabase(app);

// Function to handle sending a message when the send button is clicked
async function handleSendMessage(event) {
    try {
        // Check if the event is from the send button or the Enter key
        if (event.type === 'click' || (event.type === 'keypress' && event.key === 'Enter')) {
            const input = document.querySelector('.input');
            const message = input.value.trim();

            if (message !== '') {
                const user = auth.currentUser;
                if (user) {
                    // Check if the user is in the general room
                    if (currentRoomId === "General") {
                        const userRef = ref(database, `info/${user.uid}`);
                        const snapshot = await get(userRef);
                        if (snapshot.exists()) {
                            const userData = snapshot.val();
                            const displayName = userData.displayName;
                            const photoURL = userData.photoURL;
                            
                            // Send message with sender's information
                            sendMessageWithSenderAndRoom(message, displayName, photoURL, currentRoomId);
                        } else {
                            console.error("User info not found in the database.");
                        }
                    } else {
                        const userInvitationRef = ref(database, `invitations/${currentRoomId}/${user.uid}`);
                        const invitationSnapshot = await get(userInvitationRef);
                        const invitation = invitationSnapshot.val();
                        if (invitation && invitation.status === 'pending') {
                            // User is invited to the current room, allow sending message
                            // Fetch user info from the database
                            const userRef = ref(database, `info/${user.uid}`);
                            const snapshot = await get(userRef);
                            if (snapshot.exists()) {
                                const userData = snapshot.val();
                                const displayName = userData.displayName;
                                const photoURL = userData.photoURL;
                                
                                // Send message with sender's information
                                sendMessageWithSenderAndRoom(message, displayName, photoURL, currentRoomId);
                            } else {
                                console.error("User info not found in the database.");
                            }
                        } else {
                            // User is not invited to the current room, display a message
                            alert("Bạn không được mời vào phòng này.");
                            loadRoomsFromDatabase();
                        }
                    }
                } else {
                    console.error('User is not logged in.');
                }

                input.value = '';
            }
        }
    } catch (error) {
        console.error('Error handling send message:', error);
    }
}

// Function to send a message with sender's information
function sendMessageWithSenderAndRoom(message, displayName, photoURL, roomId) {
    const messagesRef = ref(database, `messages/${roomId}`);
    const messageWithSender = {
        message: message,
        displayName: displayName,
        photoURL: photoURL,
        timestamp: new Date().toISOString()
    };

    push(messagesRef, messageWithSender)
        .then(() => {
            console.log('Message sent successfully.');
        })
        .catch((error) => {
            console.error('Error sending message:', error);
        });
}

// Add click event listener to the send button
const sendButton = document.querySelector('.send-button');
sendButton.addEventListener('click', function(event) {
    event.preventDefault();
    handleSendMessage(event);
});

// Thêm sự kiện cho nút đính kèm file
const attachButton = document.querySelector('.attach-button');
attachButton.addEventListener('click', handleAttachButtonClick);

// Hàm xử lý sự kiện khi click nút đính kèm file
function handleAttachButtonClick() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*'; // Thay đổi kiểu file nếu muốn
    fileInput.addEventListener('change', handleFileInputChange);
    fileInput.click();
}

// Hàm xử lý sự kiện khi người dùng chọn file
async function handleFileInputChange(event) {
    const file = event.target.files[0];
    if (file) {
        try {
            const storage = getStorage(app);
            const fileRef = storageRef(storage, file.name); // Create a reference to the file
           
            // Upload file to Firebase Storage
            const snapshot = await uploadBytesResumable(fileRef, file);
            
            // Get download URL of the uploaded file
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Send message with the URL of the uploaded file
            sendMessageFile(downloadURL);
        } catch (error) {
            console.error('Lỗi khi tải file lên:', error);
        }
    } 
}

// Hàm gửi file đính kèm
async function sendMessageFile(fileUrl) {
    const user = auth.currentUser;
    if (user) {
        // Check if the user is in the general room
        if (currentRoomId === "General") {
            const userRef = ref(database, `info/${user.uid}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const displayName = userData.displayName;
                const photoURL = userData.photoURL;
                
                // Send message with sender's information
                sendMessageWithSenderAndRoom(fileUrl, displayName, photoURL, currentRoomId);
            } else {
                console.error("User info not found in the database.");
            }
        } else {
            const userInvitationRef = ref(database, `invitations/${currentRoomId}/${user.uid}`);
            const invitationSnapshot = await get(userInvitationRef);
            const invitation = invitationSnapshot.val();
            if (invitation && invitation.status === 'pending') {
                // User được mời vào phòng hiện tại, cho phép gửi tin nhắn
                // Lấy thông tin người dùng từ cơ sở dữ liệu
                const userRef = ref(database, `info/${user.uid}`);
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const displayName = userData.displayName;
                    const photoURL = userData.photoURL;

                    // Gửi tin nhắn file đính kèm với thông tin người gửi
                    sendMessageWithSenderAndRoom(fileUrl, displayName, photoURL, currentRoomId);
                } else {
                    console.error("User info not found in the database.");
                }     
            } else {
                // Người dùng không được mời vào phòng hiện tại, hiển thị thông báo
                alert("Bạn không được mời vào phòng này.");
                loadRoomsFromDatabase();
            }
        }
    } else {
        console.error('User is not logged in.');
    }
}

// Thêm sự kiện cho nút emoji
const emojiButton = document.querySelector('.emoji-button');
emojiButton.addEventListener('click', openEmojiModal);

// Function to handle emoji modal
function openEmojiModal() {
    const emojiModal = document.getElementById('emojiModal');
    emojiModal.style.display = 'block';
}
// Function to handle emoji selection
function handleEmojiSelection(emoji) {
    // Đóng modal emoji
    closeModal('emojiModal');

    // Hiển thị emoji đã chọn trong ô nhập tin nhắn
    const input = document.querySelector('.input');
    input.value += emoji;
}

// Tạo một mảng chứa các emoji
const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', 
    '🤨', '🧐', '🤓', '😎', '🤩', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', 
    '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', 
    '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', 
    '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '💋', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', 
    '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', 
    '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', 
    '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🙇', '🤦', '🤷', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', 
    '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', 
    '👨‍🚒', '👩‍🚒', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', 
    '🧜', '🧝', '💆', '💇', '🚶', '🧍', '🧎', '🧑‍🦯', '👨‍🦯', '👩‍🦯', '🧑‍🦼', '👨‍🦼', '👩‍🦼', '🧑‍🦽', '👨‍🦽', '👩‍🦽', '🏃', '💃', '🕺', '👯', '🧖', 
    '🧗', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏄', '🚣', '🏊', '⛹️', '🏋️', '🚴', '🚵', '🤸', '🤼', '🤽', '🤾', '🧘', '🛀', '🛌', '🧑‍🤝‍🧑', '👭', '👫', 
    '👬', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👪', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', 
    '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', 
    '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '🗣️', '👤', '👥', '👣', '🧳', '🌂', '☂️', '🧵', '🧶', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', 
    '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', 
    '🎓', '🧢', '⛑️', '📿', '💄', '💍', '💼', '🩸', '🩺', '🚪', '🛏️', '🛋️', '🪑', '🚽', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', 
    '🧯', '🛒', '🚬', '⚰️', '⚱️', '🗿'
];

// Thêm emoji vào modal
const emojiContainer = document.getElementById('emojiContainer');
emojis.forEach(emoji => {
    const span = document.createElement('span');
    span.textContent = emoji;
    span.classList.add('emoji');
    emojiContainer.appendChild(span);
});

// Lắng nghe sự kiện khi một emoji được chọn
const emojiIcons = document.querySelectorAll('#emojiContainer .emoji');
emojiIcons.forEach(icon => {
    icon.addEventListener('click', function() {
        const emoji = icon.textContent; // Lấy emoji từ nội dung của biểu tượng emoji
        handleEmojiSelection(emoji); // Xử lý khi chọn emoji
    });
});

// Function to handle sending a message with emoji when the send button is clicked or Enter key is pressed
async function handleSendEmoji(event) {
    try {
        // Check if the event is from the send button or the Enter key
        if (event.type === 'click' || (event.type === 'keypress' && event.key === 'Enter')) {
            const input = document.querySelector('.input');
            let message = input.value.trim();

            if (message !== '') {
                // Convert text emojis to HTML emojis
                const messageWithHTML = convertTextEmojiToHTML(message);

                const user = auth.currentUser;
                if (user) {
                    // Check if the user is in the general room
                    if (currentRoomId === "General") {
                        const userRef = ref(database, `info/${user.uid}`);
                        const snapshot = await get(userRef);
                        if (snapshot.exists()) {
                            const userData = snapshot.val();
                            const displayName = userData.displayName;
                            const photoURL = userData.photoURL;
                            
                            // Send message with sender's information
                            sendMessageWithSenderAndRoom(messageWithHTML, displayName, photoURL, currentRoomId);
                        } else {
                            console.error("User info not found in the database.");
                        }
                    } else {
                        const userInvitationRef = ref(database, `invitations/${currentRoomId}/${user.uid}`);
                        const invitationSnapshot = await get(userInvitationRef);
                        const invitation = invitationSnapshot.val();
                        if (invitation && invitation.status === 'pending') {
                            // User is invited to the current room, allow sending message
                            // Fetch user info from the database
                            const userRef = ref(database, `info/${user.uid}`);
                            const snapshot = await get(userRef);
                            if (snapshot.exists()) {
                                const userData = snapshot.val();
                                const displayName = userData.displayName;
                                const photoURL = userData.photoURL;
                                
                                // Send message with sender's information
                                sendMessageWithSenderAndRoom(messageWithHTML, displayName, photoURL, currentRoomId);
                            } else {
                                console.error("User info not found in the database.");
                            }
                        } else {
                            // User is not invited to the current room, display a message
                            alert("Bạn không được mời vào phòng này.");
                            loadRoomsFromDatabase();
                        }
                    }
                } else {
                    console.error('User is not logged in.');
                }

                input.value = '';
                selectedEmoji = ''; // Đặt lại emoji được chọn về trạng thái rỗng
            }
        }
    } catch (error) {
        console.error('Error handling send message:', error);
    }
}

// Add keypress event listener to the input field to send message when Enter is pressed
const messageInput = document.querySelector('.input');
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSendMessage(event);
        handleSendEmoji(event);
    }
});

export { auth };
