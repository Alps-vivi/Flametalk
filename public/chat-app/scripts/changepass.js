import { ref, get, getDatabase, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { app } from "./firebase-config.js";
import { currentUser } from "./room.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const db = getDatabase(app);
const auth = getAuth(app);

async function getUsernameFromDatabase() {
    if (currentUser) {
        const userEmail = currentUser.email;
        const userRef = ref(db, 'user');
        let username = null;
        try {
            const snapshot = await get(userRef);
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData.email === userEmail) {
                    username = childSnapshot.key;
                    console.log("Username của người dùng hiện tại:", username);
                }
            });
            return username;
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu người dùng:", error);
            throw error;
        }
    } else {
        console.log("Người dùng chưa đăng nhập.");
        return null;
    }
}

function handleChangePassword() {
    const changePasswordButton = document.getElementById("changePasswordButton");

    changePasswordButton.addEventListener("click", async function() {
        const oldPassword = document.getElementById("oldpassword").value;
        const newPassword = document.getElementById("newpassword").value;
        const renewPassword = document.getElementById("renewpassword").value;

        if (oldPassword === '' || newPassword === '' || renewPassword === '') {
            alert("Please fill in all password fields.");
            return;
        }

        try {
            const username = await getUsernameFromDatabase();

            if (!username) {
                alert("User not found in the database.");
                return;
            }

            const userRef = ref(db, 'user/' + username);
            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const storedPassword = userData.password;

                    if (oldPassword !== storedPassword) {
                        alert("Invalid old password. Please enter the correct old password.");
                        return;
                    }

                    update(userRef, { password: newPassword }).then(() => {
                        alert("Password changed successfully.");
                        document.getElementById("oldpassword").value = "";
                        document.getElementById("newpassword").value = "";
                        document.getElementById("renewpassword").value = "";

                        // Đăng nhập lại sau khi đổi mật khẩu thành công
                        signInWithEmailAndPassword(auth, currentUser.email, newPassword)
                            .then(() => {
                                console.log("Đăng nhập lại thành công sau khi đổi mật khẩu.");
                            })
                            .catch((error) => {
                                console.error("Lỗi khi đăng nhập lại sau khi đổi mật khẩu:", error);
                                alert("An error occurred while signing in after password change.");
                            });
                    }).catch((error) => {
                        console.error("Error updating password:", error);
                        alert("An error occurred while updating password.");
                    });
                } else {
                    alert("User data not found.");
                }
            }).catch((error) => {
                console.error("Error retrieving user data:", error);
                alert("An error occurred while retrieving user data.");
            });
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again later.");
        }
    });
}

document.addEventListener("DOMContentLoaded", handleChangePassword);
