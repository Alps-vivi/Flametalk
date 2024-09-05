import { app } from "./firebase-config.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from "./message.js";

// Đặt mã xử lý logout vào trong một hàm
function handleLogout() {
    // Kiểm tra xem auth đã được định nghĩa chưa
    if (typeof auth !== 'undefined') {
        document.getElementById("logout").addEventListener("click", function() {
            // Thực hiện đăng xuất người dùng
            signOut(auth)
            .then(() => {
                // Chuyển hướng người dùng về trang đăng nhập khi đăng xuất thành công
                // Làm cho transition hiển thị trước khi chuyển hướng
                const transition_el = document.querySelector('.transition');
                transition_el.classList.add('is-active');
                
                // Chờ một khoảng thời gian trước khi chuyển hướng
                setTimeout(() => {
                    // Chuyển hướng người dùng đến trang register.html
                    window.location.href = "../index.html";
                }, 500); // Chờ 0.5 giây trước khi chuyển hướng
            }).catch((error) => {
                console.error("Lỗi khi đăng xuất:", error);
                alert("Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại sau.");
            });
        });
    } else {
        console.error("Biến auth chưa được định nghĩa.");
    }
}

// Gọi hàm handleLogout sau khi tài liệu HTML đã được tải hoàn toàn
document.addEventListener("DOMContentLoaded", handleLogout);
