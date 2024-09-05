// Import các hàm cần thiết từ Firebase SDK
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { app } from "./firebase-config.js";

// Lấy tham chiếu đến dịch vụ cơ sở dữ liệu Firebase
const db = getDatabase(app);

// Xử lý sự kiện khi trang web được tải hoàn thành
document.addEventListener("DOMContentLoaded", function() {
    // Xử lý sự kiện khi người dùng nhập username
    document.getElementById("username").addEventListener("input", function() {
        const username = this.value.trim();
        if (username !== '') {
            // Load câu hỏi bảo mật từ Firebase và điền vào trường input
            loadSecurityQuestion(username);
        }
    });
});

// Hàm load câu hỏi bảo mật từ Firebase và điền vào trường input
function loadSecurityQuestion(username) {
    // Tham chiếu đến nút câu hỏi bảo mật trong cơ sở dữ liệu Firebase dựa trên username
    const securityQuestionRef = ref(db, `user/${username}/securityQuestion`);

    // Lấy dữ liệu từ Firebase
    get(securityQuestionRef)
    .then((snapshot) => {
        if (snapshot.exists()) {
            const securityQuestion = snapshot.val();
            // Điền câu hỏi vào trường input
            document.getElementById("security-question").value = securityQuestion;
        } else {
            console.error("Không tìm thấy câu hỏi bảo mật trong cơ sở dữ liệu cho username này.");
        }
    })
    .catch((error) => {
        console.error("Lỗi khi load câu hỏi bảo mật từ Firebase:", error);
    });
}

// Xử lý sự kiện khi người dùng nhấn nút "Submit"
document.getElementById("retake").addEventListener("click", function() {
    // Lấy giá trị từ các trường đầu vào
    const username = document.getElementById("username").value.trim();
    const securityQuestion = document.getElementById("security-question").value.trim();
    const securityAnswer = document.getElementById("security-answer").value.trim();

    // Kiểm tra xem các trường đầu vào có hợp lệ không
    if (username === '' || securityQuestion === '' || securityAnswer === '') {
        alert("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    // Kiểm tra xem câu hỏi bảo mật và câu trả lời có khớp với dữ liệu trong cơ sở dữ liệu hay không
    const userRef = ref(db, `user/${username}`);
    get(userRef)
    .then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            // Nếu tìm thấy tài khoản, kiểm tra câu hỏi bảo mật và câu trả lời
            if (userData.securityQuestion === securityQuestion && userData.securityAnswer === securityAnswer) {
                // Nếu câu hỏi bảo mật và câu trả lời khớp, hiển thị mật khẩu
                alert("Mật khẩu của bạn là: " + userData.password);
            } else {
                // Nếu câu hỏi bảo mật hoặc câu trả lời không khớp, thông báo lỗi
                alert(" câu trả lời không đúng.");
            }
        } else {
            // Nếu không tìm thấy tài khoản, thông báo lỗi
            alert("Không tìm thấy tài khoản với thông tin đã nhập.");
        }
    })
    .catch((error) => {
        console.error("Lỗi khi kiểm tra tài khoản:", error);
        alert("Đã xảy ra lỗi. Vui lòng thử lại sau.");
    });
});

// Xử lý sự kiện khi người dùng nhấn nút "Login"
document.getElementById("LoginPage").addEventListener("click", function() {
    // Làm cho transition hiển thị trước khi chuyển hướng
    const transition_el = document.querySelector('.transition');
    transition_el.classList.add('is-active');
    
    // Chờ một khoảng thời gian trước khi chuyển hướng
    setTimeout(() => {
        // Chuyển hướng người dùng đến trang register.html
        window.location.href = "../index.html";
    }, 500); // Chờ 0.5 giây trước khi chuyển hướng
});
