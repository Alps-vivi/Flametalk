import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { app } from "./firebase-config.js";
import { ref, get, getDatabase, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { auth } from "./room.js";

const db = getDatabase(app);

// Function to update user info from provider (Google, Facebook)
function saveUserInfoFromProviderToDatabase(user) {
    if (user) {
        // Kiểm tra nếu người dùng đăng nhập bằng Google hoặc Facebook
        if (user.providerData && (user.providerData[0].providerId === "google.com" || user.providerData[0].providerId === "facebook.com")) {
            const displayName = user.displayName;
            const photoURL = user.photoURL;

            // Update UI with user info
            document.getElementById("avatar").src = photoURL;
            document.getElementById("displayName").innerText = displayName;

            // Save user info to Firebase Realtime Database
            const userRef = ref(db, `info/${user.uid}`);
            set(userRef, {
                displayName: displayName,
                photoURL: photoURL
            })
            .then(() => {
                console.log("User info saved to Firebase.");
            })
            .catch((error) => {
                console.error("Error saving user info to Firebase:", error);
            });

            // Save UID of the user to 'user' node
            const username = displayName;
            const uid = user.uid;
            set(ref(db, `user/${displayName}`), {
                username : username,
                uid: uid
            })
            .then(() => {
                console.log("User UID saved to Firebase 'user' node.");
            })
            .catch((error) => {
                console.error("Error saving user UID to Firebase 'user' node:", error);
            });
        }
    }
}

function saveUserInfoFromInputToDatabase(user) {
    if (user) {
        const userRef = ref(db, `info/${user.uid}`);
        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    document.getElementById("displayName").innerText = userData.displayName;
                    if (userData.photoURL) {
                        document.getElementById("avatar").src = userData.photoURL;
                    }
                } else {
                    // Nếu thông tin người dùng không tồn tại, tạo một bản ghi mới
                    const photoURL = `img/ava.png`; // Đường dẫn ảnh mặc định
                    const username = user.email; // Lấy username từ displayName của người dùng
                    set(ref(db, `info/${user.uid}`), {
                        displayName: username,
                        photoURL: photoURL
                    })
                    .then(() => {
                        console.log("New user info created in the database.");
                        // Hiển thị thông tin mới trong giao diện
                        document.getElementById("displayName").innerText = username;
                        document.getElementById("avatar").src = photoURL;
                    })
                    .catch((error) => {
                        console.error("Error creating new user info:", error);
                    });
                }
            })
            .catch((error) => {
                console.error("Error retrieving user info from the database:", error);
            });
    }
}

onAuthStateChanged(auth, (user) => {
    saveUserInfoFromInputToDatabase(user);
    saveUserInfoFromProviderToDatabase(user);
});

// Show modal when clicking on avatar
document.getElementById("avatar").addEventListener("click", function() {
    const modal = document.getElementById("avatarModal");
    modal.style.display = "block";

    // Đóng modal khi nhấp vào nút đóng (x)
    const closeButton = document.querySelector("#avatarModal .close2");
    closeButton.onclick = function() {
        modal.style.display = "none";
        cancelAvatarSelection(); // Gọi hàm để hủy chọn ảnh đại diện
    };

    // Lưu thông tin người dùng khi nhấp vào nút lưu
    const saveUserInfoButton = document.getElementById("saveUserInfoButton");
    saveUserInfoButton.onclick = function() {
        saveUserInfoToDatabase();
        modal.style.display = "none";
        selectNewAvatar(); // Gọi hàm để chọn ảnh đại diện mới
    };

    // Thêm chức năng cho việc chọn ảnh đại diện mới
    const avatarOptions = document.querySelectorAll(".avatar-option");
    avatarOptions.forEach(option => {
        option.addEventListener("click", function() {
            // Xóa lớp selected của tất cả các hình ảnh
            avatarOptions.forEach(opt => opt.classList.remove("selected"));
            // Thêm lớp selected cho hình ảnh đang được chọn
            this.classList.add("selected");
            const newAvatarSrc = this.src;
            document.getElementById("avatar").src = newAvatarSrc;
        });
    });

    // Xử lý sự kiện khi người dùng upload ảnh đại diện mới
    const uploadButton = document.getElementById("uploadButton");
    uploadButton.addEventListener("change", function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            // Xóa lớp selected của tất cả các hình ảnh
            avatarOptions.forEach(opt => opt.classList.remove("selected"));
            const newAvatarSrc = event.target.result;
            document.getElementById("avatar").src = newAvatarSrc;
        };
        reader.readAsDataURL(file);
    });
});

// Function to select new avatar
function selectNewAvatar() {
    const selectedAvatar = document.querySelector(".avatar-option.selected");
    if (selectedAvatar) {
        const newAvatarSrc = selectedAvatar.src;
        document.getElementById("avatar").src = newAvatarSrc;
    }
}

// Function to cancel avatar selection
function cancelAvatarSelection() {
    const avatarOptions = document.querySelectorAll(".avatar-option");
    avatarOptions.forEach(option => {
        option.classList.remove("selected");
    });
}

// Function to save user info to the database
function saveUserInfoToDatabase() {
    const newDisplayName = document.getElementById("newDisplayName").value;

    const user = auth.currentUser;
    const userRef = ref(db, `info/${user.uid}`);
    
    // Kiểm tra xem trường nhập liệu displayName mới có rỗng hay không
    if (newDisplayName.trim() === '') {
        // Nếu rỗng, giữ nguyên displayName hiện tại
        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    set(userRef, {
                        displayName: userData.displayName, // Giữ nguyên displayName hiện tại
                        photoURL: document.getElementById("avatar").src  // Lưu URL của ảnh đại diện
                    }).then(() => {
                        // Không cần cập nhật hiển thị của displayName
                    }).catch(error => {
                        console.error("Error updating user info:", error);
                    });
                }
            })
            .catch((error) => {
                console.error("Error retrieving user info from the database:", error);
            });
    } else {
        // Nếu không rỗng, lưu displayName mới
        set(userRef, {
            displayName: newDisplayName,
            photoURL: document.getElementById("avatar").src  // Lưu URL của ảnh đại diện
        }).then(() => {
            // Cập nhật hiển thị của displayName mà không cần reload trang
            document.getElementById("displayName").innerText = newDisplayName;
        }).catch(error => {
            console.error("Error updating user info:", error);
        });
    }
}

//export
export { auth };