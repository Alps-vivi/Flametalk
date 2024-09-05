// Import các hàm cần thiết từ Firebase SDK
import { getDatabase, ref, onValue, set, remove, get, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { app } from "./firebase-config.js";
import { currentRoomId, currentUser } from "./room.js";

// Lấy tham chiếu đến dịch vụ cơ sở dữ liệu Firebase
const db = getDatabase(app);

function displayUserList(users) {
    const userListContainer = document.getElementById("user-list-container");
    userListContainer.innerHTML = ''; // Xóa danh sách người dùng hiện tại
    users.forEach(user => {
        const userItem = document.createElement("div");
        userItem.classList.add("user-item");
        userItem.textContent = user.username; // Hiển thị username của người dùng
        userItem.dataset.userId = user.uid; // Lưu ID của người dùng vào thuộc tính dữ liệu
        userItem.dataset.selected = "false"; // Đánh dấu trạng thái chưa được chọn
        userItem.addEventListener('click', () => { // Gán sự kiện click cho userItem
            let userId = userItem.dataset.userId; // Lấy userId của userItem
            selectUser(userItem, userId); // Truyền cả userItem và userId vào hàm selectUser
        });
        userListContainer.appendChild(userItem);
    });
}

// Lấy danh sách người dùng từ Firebase
function getUsersFromFirebase() {
    const usersRef = ref(db,'user'); 
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        if (users) {
            const userList = Object.values(users);
            displayUserList(userList);
        }
    });
}

// Hàm mời người dùng vào phòng
function inviteUser(selectedUserId) {
    const roomId = currentRoomId;
    const inviteRef = ref(db, `invitations/${roomId}/${selectedUserId}`);
    const infoRef = ref(db, `info/${selectedUserId}`);

    // Lấy thông tin người dùng từ infoRef
    get(infoRef)
        .then((snapshot) => {
            const userInfo = snapshot.val();
            if (userInfo && userInfo.displayName) {
                const username = userInfo.displayName; // Lấy displayName của người dùng
                // Gửi thông tin mời đến Firebase
                set(inviteRef, { username: username, status: 'pending' }) 
                    .then(() => {
                        console.log("Người dùng đã được mời thành công vào phòng.");
                        closeModal('inviteModal'); 
                    })
                    .catch(error => {
                        console.error("Lỗi khi mời người dùng vào phòng:", error);
                    });
            } else {
                console.error("Không tìm thấy displayName của người dùng trong info.");
            }
        })
        .catch(error => {
            console.error("Lỗi khi lấy thông tin người dùng từ info:", error);
        });
}

// Thêm sự kiện click cho nút "Mời"
const inviteButton = document.querySelector('.invite-button');
inviteButton.addEventListener('click', () => {
    // Hiển thị danh sách người dùng khi nút "Mời" được nhấp vào
    getUsersFromFirebase();
    // Hiển thị modal mời
    openInviteModal();
});

// Khai báo biến global để lưu danh sách người dùng đã chọn
let selectedUsers = [];

// Thêm hoặc loại bỏ người dùng khỏi danh sách mời
function toggleUserInQueue(userId) {
    const index = selectedUsers.indexOf(userId);
    if (index === -1) {
        selectedUsers.push(userId); // Thêm vào danh sách nếu chưa được chọn
    } else {
        selectedUsers.splice(index, 1); // Loại bỏ khỏi danh sách nếu đã được chọn
    }
}

// Thêm sự kiện click cho mỗi người dùng để chọn hoặc bỏ chọn
function selectUser(userItem, userId) {
    toggleUserInQueue(userId); // Thêm hoặc loại bỏ người dùng khỏi danh sách chờ
    const isSelected = userItem.dataset.selected === "true";
    if (isSelected) {
        // Loại bỏ các thuộc tính CSS khi phần tử được chọn lại
        userItem.classList.remove("selected");
        userItem.dataset.selected = "false";
    } else {
        // Thêm các thuộc tính CSS khi phần tử được chọn
        userItem.classList.add("selected");
        userItem.dataset.selected = "true";
    }
}

// Hàm mời các người dùng từ danh sách chờ
function inviteSelectedUsers() {
    selectedUsers.forEach(userId => inviteUser(userId)); // Mời từng người dùng trong danh sách chờ
    selectedUsers = []; // Xóa danh sách chờ sau khi mời
}

// Sử dụng sự kiện click cho mỗi người dùng để chọn hoặc bỏ chọn
const userItems = document.querySelectorAll('.user-item');
userItems.forEach(userItem => {
    const userId = userItem.dataset.userId;
    userItem.addEventListener('click', () => {
        selectUser(userId); // Chọn hoặc bỏ chọn người dùng
    });
});

// Hàm mời các người dùng từ danh sách chờ khi nhấn nút "Mời"
const inviteSelectedButton = document.getElementById('inviteSelectedButton');
inviteSelectedButton.addEventListener('click', () => {
    inviteSelectedUsers();
    closeModal('inviteModal');
});

// Cập nhật HTML để phản ánh trạng thái chọn của người dùng
function updateUI() {
    selectedUsers.forEach(userId => {
        const userItem = document.getElementById(`user-${userId}`);
        if (userItem) {
            userItem.classList.add("selected");
        }
    });
}

// Hàm mở modal mời người dùng
function openInviteModal() {
    const inviteModal = document.getElementById('inviteModal');
    inviteModal.style.display = 'block';
    updateUI(); // Cập nhật giao diện để thể hiện trạng thái chọn của người dùng
}

// Hàm đóng modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Lấy danh sách thành viên của phòng từ Firebase
function getRoomMembersFromFirebase(roomId) {
    const roomMembersRef = ref(db, `invitations/${roomId}`);
    return onValue(roomMembersRef, (snapshot) => {
        const membersObject = snapshot.val(); // Lấy đối tượng chứa thông tin thành viên
        const members = []; // Mảng để lưu thông tin của thành viên
        for (const memberId in membersObject) {
            if (Object.hasOwnProperty.call(membersObject, memberId)) {
                const member = membersObject[memberId]; // Lấy thông tin của thành viên
                member.uid = memberId; // Gán uid cho thành viên
                members.push(member); // Thêm thành viên vào mảng
            }
        }
        displayRoomMembers(members); // Hiển thị danh sách thành viên
    });
}

// Hiển thị danh sách thành viên trong modal
function displayRoomMembers(members) {
    const roomMembersContainer = document.getElementById("room-members-container");
    roomMembersContainer.innerHTML = ''; // Xóa danh sách thành viên hiện tại

    members.forEach(member => {
        // Kiểm tra xem thành viên có phải là bản thân của người dùng không
        if (member.uid !== currentUser.uid) {
            const memberItem = document.createElement("div");
            memberItem.classList.add("member-item");

            const usernameSpan = document.createElement("span");
            usernameSpan.textContent = member.username; // Hiển thị username của thành viên
            memberItem.appendChild(usernameSpan);

            const removeButton = document.createElement("button");
            removeButton.classList.add("remove-button");
            removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            removeButton.addEventListener("click", () => {
                // Gọi hàm removeUserFromInvitation để xóa thành viên khỏi danh sách mời
                removeUserFromInvitation(member.uid, currentRoomId);
                // Sau khi xóa, kiểm tra xem memberItem có là con của roomMembersContainer không trước khi xóa
                if (roomMembersContainer.contains(memberItem)) {
                    roomMembersContainer.removeChild(memberItem);
                }
            });
            memberItem.appendChild(removeButton);

            roomMembersContainer.appendChild(memberItem);
        }
    });
}

// Hàm mở modal hiển thị danh sách thành viên
function openMemberModal() {
    const memberModal = document.getElementById('memberModal');
    memberModal.style.display = 'block';

    // Lấy danh sách thành viên của phòng hiện tại và hiển thị trong modal
    const roomId = currentRoomId;
    getRoomMembersFromFirebase(roomId);
}

// Function để xóa người dùng khỏi danh sách mời (invitation)
function removeUserFromInvitation(userId, roomId) {
    const invitationRef = ref(db, `invitations/${roomId}/${userId}`);
    remove(invitationRef)
        .then(() => {
            console.log("Người dùng đã được xóa khỏi danh sách mời.");
            // Sau khi xóa thành viên, cập nhật lại danh sách thành viên từ Firebase
            getRoomMembersFromFirebase(roomId);
        })
        .catch(error => {
            console.error("Lỗi khi xóa người dùng khỏi danh sách mời:", error);
        });
}

const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", searchUsers);

function searchUsers() {
    const input = document.getElementById("searchInput");
    const filter = input.value.toUpperCase();
    const userItems = document.querySelectorAll('.user-item');

    userItems.forEach(userItem => {
        const username = userItem.textContent.toUpperCase();
        if (username.indexOf(filter) > -1) {
            userItem.style.display = "";
        } else {
            userItem.style.display = "none";
        }
    });
}

//export
export { inviteUser, displayRoomMembers, removeUserFromInvitation, openMemberModal, getUsersFromFirebase };
