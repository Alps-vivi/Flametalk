// Import các hàm cần thiết từ Firebase SDK
import { getDatabase, ref, onValue, set, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { app } from "./firebase-config.js";
import { inviteUser, getUsersFromFirebase, openMemberModal, removeUserFromInvitation } from "./member.js";

// Lấy tham chiếu đến dịch vụ cơ sở dữ liệu Firebase
const db = getDatabase(app);
const auth = getAuth();
let currentUser = null;

//Kiểm tra xem người dùng đã đăng nhập hay chưa
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Nếu đã đăng nhập, chuyển hướng đến trang chat.html
        console.log("Người dùng đã đăng nhập:", user);
        currentUser = user;
    } else {
        console.log("Không có người dùng đăng nhập.");
    }
});

// Khai báo biến currentRoomId
let currentRoomId = null;

// Khởi tạo danh sách phòng ban đầu
const rooms = [
    { id: 1, name: "General", description: "Default Room" }
];

// Function để kiểm tra và tạo phòng General nếu chưa tồn tại
function checkAndCreateGeneralRoom() {
    const roomsRef = ref(db, 'rooms');
    onValue(roomsRef, (snapshot) => {
        const rooms = snapshot.val();
        if (!rooms || !Object.values(rooms).some(room => room.name === "General")) {
            const newRoomRef = push(roomsRef);
            const newRoomData = { id: "General" ,name: "General", description: "Default Room" };
            set(newRoomRef, newRoomData);
        }
    });
}

// Kiểm tra và tạo phòng General khi trang được tải
window.addEventListener('load', () => {
    checkAndCreateGeneralRoom();
    loadRoomsFromDatabase();
});

// Function để load toàn bộ phòng từ Firebase Database
function loadRoomsFromDatabase() {
    const roomsRef = ref(db, 'rooms');
    onValue(roomsRef, (snapshot) => {
        rooms.splice(0, rooms.length); // Xóa danh sách phòng hiện tại
        snapshot.forEach((childSnapshot) => {
            const room = childSnapshot.val();
            if (room.id === "General") {
                // Nếu là phòng General, cho phép hiển thị cho tất cả mọi người
                rooms.push(room);
            } else {
                const invitedRef = ref(db, `invitations/${room.id}/${currentUser.uid}`);
                onValue(invitedRef, (invitedSnapshot) => {
                    const invitation = invitedSnapshot.val();
                    if (invitation && invitation.status === 'pending') {
                        // Nếu người dùng đã được mời vào phòng và trạng thái là "pending"
                        // Kiểm tra xem phòng đã tồn tại trong danh sách rooms chưa
                        if (!rooms.some(existingRoom => existingRoom.id === room.id)) {
                            rooms.push(room);
                        }
                    }
                    // Hiển thị danh sách phòng sau khi tải từ Firebase
                    displayRooms();
                });
            }
        });

        // Nếu currentRoomId không tồn tại trong danh sách phòng,
        // chuyển đổi sang phòng General
        if (!rooms.some(room => room.id === currentRoomId)) {
            currentRoomId = "General";
            displayRoomMessages(currentRoomId); // Hiển thị tin nhắn của phòng General
        }
    });
}

function displayRooms() {
    const roomListContainer = document.getElementById("room-panel-content");
    roomListContainer.innerHTML = '';
    rooms.forEach(room => {
        const roomItem = document.createElement("div");
        roomItem.classList.add("room-item");
        roomItem.id = `room-${room.id}`;

        const roomLink = document.createElement("a");
        // Kiểm tra độ dài của tên phòng và cắt ngắn nếu quá dài
        const displayName = room.name.length > 25 ? room.name.substring(0, 22) + "..." : room.name;
        roomLink.textContent = displayName;
        roomLink.title = room.name; // Thêm title để hiển thị toàn bộ tên khi di chuột qua
        roomLink.classList.add("link");
        
        let isNewRoom = false; // Biến để đánh dấu xem phòng có phải là phòng mới hay không
        
        roomItem.addEventListener("click", () => {
            // Kiểm tra xem phòng có phải là phòng mới hay không
            if (!isNewRoom) {
                // Nếu không phải là phòng mới, hiển thị tin nhắn của phòng được chọn
                room.selected = true;
                // Đặt selected = false cho các phòng khác
                rooms.filter(r => r.id !== room.id).forEach(r => r.selected = false);
                // Cập nhật currentRoomId
                currentRoomId = room.id;
                // Hiển thị tin nhắn của phòng được chọn
                displayRoomMessages(room.id);
                innerTextProblem(room.id);
                updateUIForSelectedRoom(room.id);
            } else {
                // Nếu là phòng mới, cho phép chỉnh sửa tên phòng
                const newRoomName = prompt("Nhập tên mới cho phòng:", room.name);
                if (newRoomName !== null) {
                    handleEditRoom(room.id, newRoomName, room.description);
                }
            }
        });        

        // Kiểm tra xem phòng có phải là phòng mới hay không
        isNewRoom = room.name === "General" && room.id === 1;

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-button");
        const trashIcon = document.createElement("i");
        trashIcon.classList.add("fas", "fa-trash-alt"); // Thêm class cho biểu tượng thùng rác từ Font Awesome
        deleteButton.appendChild(trashIcon);
        deleteButton.addEventListener("click", () => {
            handleDeleteRoom(room.id);
        });

        roomItem.appendChild(roomLink);
        roomItem.appendChild(deleteButton);
        roomListContainer.appendChild(roomItem);

        innerTextProblem(room.id);
    });
}

// Function để cập nhật giao diện người dùng dựa trên trạng thái của phòng
function updateUIForSelectedRoom(roomId) {
    const roomItems = document.querySelectorAll(".room-item");

    // Lặp qua tất cả các phần tử phòng và loại bỏ lớp CSS 'selected-room' nếu không phải là phòng được chọn
    roomItems.forEach(item => {
        if (item.id === `room-${roomId}`) {
            item.classList.add("selected-room");
        } else {
            item.classList.remove("selected-room");
        }
    });
}

// Function để hiển thị tin nhắn của phòng
function displayRoomMessages(roomId) {
    // Lấy ra phòng được chọn
    const selectedRoom = rooms.find(room => room.id === roomId);
    // Kiểm tra xem phòng có tồn tại không
    if (selectedRoom) {
        // Cập nhật tiêu đề và mô tả của phòng trong giao diện
        document.querySelector('.header__title').textContent = selectedRoom.name;
        document.querySelector('.header__description').textContent = selectedRoom.description;
        // Hiển thị tin nhắn của phòng
        const messagesRef = ref(db, `messages/${roomId}`);
        onValue(messagesRef, (snapshot) => {
            const messageList = document.querySelector('.message-list');
            messageList.innerHTML = ''; // Xóa nội dung tin nhắn cũ
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                appendMessage(message);
            });
        });
    }
}

// Function to append a message to the message list
function appendMessage(message) {
    const messageList = document.querySelector('.message-list');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    // Create sender-info element
    const senderInfo = document.createElement('div');
    senderInfo.classList.add('sender-info');

    // Create sender-info0 element for sender-name
    const senderInfo0 = document.createElement('div');
    senderInfo0.classList.add('sender-info0');

    // Create sender-avatar element
    const senderAvatar = document.createElement('img');
    senderAvatar.classList.add('sender-avatar');
    senderAvatar.alt = "Sender's Avatar";
    senderAvatar.src = message.photoURL;

    // Create sender-name element
    const senderName = document.createElement('span');
    senderName.classList.add('sender-name');
    senderName.innerText = message.displayName;

    // Create message-content element
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');

    // Handle message as an image URL
    if (message.message.startsWith('http')) {
        const imageElement = document.createElement('img');
        imageElement.src = message.message;
        imageElement.classList.add('message-image');
        messageContent.appendChild(imageElement);
        // Attach event listener to open image in modal
        imageElement.addEventListener('click', function() {
            const modal = document.getElementById('imgModal');
            const modalImg = document.getElementById('img01');
            modal.style.display = 'block';
            modalImg.src = this.src;
        });
    } else {
        messageContent.innerText = message.message;
    }

    // Append elements to message
    messageElement.appendChild(senderInfo);
    senderInfo0.appendChild(messageContent);
    senderInfo.appendChild(senderInfo0);
    senderInfo.appendChild(senderName);
    senderInfo0.appendChild(senderAvatar);

    // Append message to the message list
    messageList.appendChild(messageElement);

    // Scroll to the bottom of the message list
    messageList.scrollTop = messageList.scrollHeight;
}

// Function để xử lý sự kiện thêm phòng mới
function handleAddRoom() {
    const roomName = prompt("Nhập tên phòng mới:");
    const roomDescription = prompt("Nhập mô tả phòng mới (nếu có):");
    if (roomName !== null) {
        addRoomToDatabase(roomName, roomDescription);
    }
}

function addRoomToDatabase(roomName, roomDescription) {
    // Xử lý chuỗi `roomName` để loại bỏ các ký tự không hợp lệ
    roomName = roomName.replace(/[.#$[\]]/g, "");

    const roomsRef = ref(db, 'rooms');
    const newRoomRef = push(roomsRef); // Tạo một khóa mới cho phòng mới
    const roomId = newRoomRef.key; // Lấy khóa của phòng mới

    const newRoomData = { id: roomId, name: roomName, description: roomDescription || "", creator: currentUser.uid };
    set(newRoomRef, newRoomData)
        .then(() => {
            console.log("Phòng đã được thêm vào cơ sở dữ liệu thành công.");
            // Cập nhật currentRoomId
            currentRoomId = roomId;
            // Hiển thị tin nhắn của phòng mới
            displayRoomMessages(currentRoomId);
            // Mời người tạo room vào phòng mới
            inviteUser(currentUser.uid);
        })
        .catch((error) => {
            console.error("Lỗi khi thêm phòng vào cơ sở dữ liệu:", error);
            alert("Đã xảy ra lỗi khi thêm phòng. Vui lòng thử lại sau.");
        });
}

// Function để xử lý sự kiện xóa phòng
function handleDeleteRoom(roomId) {
    const confirmDelete = confirm("Bạn có chắc muốn xóa phòng này?");
    if (confirmDelete) {
        // Tìm phòng cần xóa trong danh sách rooms
        const roomToDelete = rooms.find(room => room.id === roomId);
        // Kiểm tra xem người dùng hiện tại có phải là người tạo phòng không
        if (roomToDelete.creator === currentUser.uid) {
            // Nếu là người tạo phòng, thực hiện xóa phòng
            const roomRef = ref(db, `rooms/${roomId}`);
            remove(roomRef)
                .then(() => {
                    console.log("Phòng đã được xóa thành công.");
                    // Xóa phòng khỏi danh sách rooms
                    const index = rooms.findIndex(room => room.id === roomId);
                    if (index !== -1) {
                        rooms.splice(index, 1);
                        displayRooms(); // Cập nhật lại danh sách phòng trên giao diện
                        // Nếu phòng đang được hiển thị trên giao diện, thì hiển thị phòng General
                        if (currentRoomId === roomId) {
                            currentRoomId = "General";
                            displayRoomMessages(currentRoomId);
                        }
                    }
                    // Xóa tin nhắn trong phòng tương ứng
                    const messagesRef = ref(db, `messages/${roomId}`);
                    remove(messagesRef)
                        .then(() => {
                            console.log("Các tin nhắn trong phòng đã được xóa thành công.");
                        })
                        .catch((error) => {
                            console.error("Lỗi khi xóa tin nhắn trong phòng:", error);
                        });
                    // Xóa danh sách mời của phòng tương ứng
                    const invitationsRef = ref(db, `invitations/${roomId}`);
                    remove(invitationsRef)
                        .then(() => {
                            console.log("Danh sách mời của phòng đã được xóa thành công.");
                        })
                        .catch((error) => {
                            console.error("Lỗi khi xóa danh sách mời của phòng:", error);
                        });
                })
                .catch((error) => {
                    console.error("Lỗi khi xóa phòng:", error);
                    alert("Đã xảy ra lỗi khi xóa phòng. Vui lòng thử lại sau.");
                });
        } else {
            // Nếu không phải người tạo phòng, không cho phép xóa và hiển thị thông báo
            alert("Bạn không có quyền xóa phòng này.");
        }
    }
}

// Function để xử lý sự kiện chỉnh sửa phòng
function handleEditRoom(roomId, newRoomName, newRoomDescription) {
    // Lấy thông tin của phòng từ danh sách rooms
    const roomToUpdate = rooms.find(room => room.id === roomId);

    // Kiểm tra xem người dùng hiện tại có phải là người tạo phòng không
    if (roomToUpdate.creator !== currentUser.uid) {
        // Nếu không phải là người tạo phòng, không cho phép chỉnh sửa và hiển thị thông báo
        alert("Bạn không có quyền chỉnh sửa phòng này.");
        return; // Kết thúc hàm nếu không phải người tạo phòng
    }

    // Cập nhật thông tin của phòng trên Firebase
    const roomRef = ref(db, `rooms/${roomId}`);
    const updatedRoomData = {};

    // Kiểm tra và cập nhật tên phòng
    if (newRoomName !== null && newRoomName.trim() !== "") {
        updatedRoomData.name = newRoomName.trim();
    } else {
        // Nếu không nhập tên mới, giữ nguyên tên cũ
        updatedRoomData.name = roomToUpdate.name;
    }

    // Kiểm tra và cập nhật mô tả của phòng
    if (newRoomDescription !== null) {
        updatedRoomData.description = newRoomDescription;
    } else {
        // Nếu không nhập mô tả mới, giữ nguyên mô tả cũ
        updatedRoomData.description = roomToUpdate.description;
    }

    // Cập nhật trường "creator" và "id" cho phòng
    updatedRoomData.creator = roomToUpdate.creator;
    updatedRoomData.id = roomToUpdate.id;

    // Lưu cập nhật vào cơ sở dữ liệu Firebase
    set(roomRef, updatedRoomData)
        .then(() => {
            console.log("Thông tin phòng đã được cập nhật thành công.");
            // Cập nhật danh sách phòng trên giao diện
            loadRoomsFromDatabase();
            // Nếu phòng đang được hiển thị, cập nhật tiêu đề và mô tả của nó
            if (currentRoomId === roomId) {
                document.querySelector('.header__title').textContent = updatedRoomData.name;
                document.querySelector('.header__description').textContent = updatedRoomData.description;
            }
        })
        .catch((error) => {
            console.error("Lỗi khi cập nhật thông tin phòng:", error);
            alert("Đã xảy ra lỗi khi cập nhật thông tin phòng. Vui lòng thử lại sau.");
        });
}

// Function để hiển thị member hoặc leave cho phòng
function handleDisplayMemberOrLeaveButton(roomId) {
    const roomToUpdate = rooms.find(room => room.id === roomId);

    if (roomToUpdate.creator === currentUser.uid) {
        getUsersFromFirebase();
        // Hiển thị modal
        openMemberModal();
    } else {
        removeUserFromInvitation(currentUser.uid, roomId);
        loadRoomsFromDatabase();
    }
}

function innerTextProblem(roomid) {
    const memberRoomButton = document.getElementById("inout-button");
    if (currentRoomId !== "General") {
        const roomToUpdate = rooms.find(room => room.id === roomid);
        if (roomToUpdate.creator === currentUser.uid) {
            memberRoomButton.innerHTML = '<i class="fas fa-users"></i> Member';
        } else {
            memberRoomButton.innerHTML = '<i class="fas fa-door-open"></i> Leave';
        }
    } else {
        memberRoomButton.innerHTML = '<i class="fas fa-user-plus"></i> Member';
    }
}

// Thêm sự kiện click cho nút chỉnh sửa phòng
const memberRoomButton = document.getElementById("inout-button");
memberRoomButton.addEventListener("click", () => {
    // Kiểm tra xem currentRoomId có phải là phòng mặc định hay không
    if (currentRoomId !== "General") {
        // Nếu không phải phòng mặc định, cho phép chỉnh sửa
        handleDisplayMemberOrLeaveButton(currentRoomId);
    } else {
        // Nếu đang ở phòng mặc định, không cho phép chỉnh sửa và hiển thị thông báo
        alert("Bạn không thể chỉnh sửa phòng mặc định.");
    }
});

// Thêm sự kiện click cho nút chỉnh sửa phòng
const editRoomButton = document.getElementById("edit-room-button");
editRoomButton.addEventListener("click", () => {
    // Kiểm tra xem currentRoomId có phải là phòng mặc định hay không
    if (currentRoomId !== "General") {
        // Nếu không phải phòng mặc định, cho phép chỉnh sửa
        const newRoomName = prompt("Nhập tên mới cho phòng:");
        const newRoomDescription = prompt("Nhập mô tả mới cho phòng:");
        handleEditRoom(currentRoomId, newRoomName, newRoomDescription);
    } else {
        // Nếu đang ở phòng mặc định, không cho phép chỉnh sửa và hiển thị thông báo
        alert("Bạn không thể chỉnh sửa phòng mặc định.");
    }
});

// Thêm sự kiện click cho nút thêm phòng mới
const addRoomButton = document.getElementById("add-room-button");
addRoomButton.addEventListener("click", () => {
    handleAddRoom();
});

//export
export {currentRoomId, appendMessage, auth, currentUser,loadRoomsFromDatabase };
