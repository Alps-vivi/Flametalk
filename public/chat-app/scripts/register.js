// Import các hàm cần thiết từ Firebase SDK
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { app } from "./firebase-config.js";

// Lấy tham chiếu đến dịch vụ cơ sở dữ liệu Firebase
const db = getDatabase(app);

// Lấy tham chiếu đến dịch vụ xác thực Firebase
const auth = getAuth(app);

// Xử lý sự kiện khi người dùng nhấn phím Enter trên các trường nhập liệu
document.getElementById("username").addEventListener('keypress', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById("email").focus(); // Di chuyển trỏ chuột đến trường nhập liệu email
    }
});

document.getElementById("email").addEventListener('keypress', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById("password").focus(); // Di chuyển trỏ chuột đến trường nhập liệu password
    }
});

document.getElementById("password").addEventListener('keypress', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById("repassword").focus(); // Di chuyển trỏ chuột đến trường nhập liệu repassword
    }
});

document.getElementById("repassword").addEventListener('keypress', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById("security-answer").focus(); // Di chuyển trỏ chuột đến trường nhập liệu security-answer
    }
});

document.getElementById("security-answer").addEventListener('keypress', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        register(); // Gọi hàm xử lý đăng ký khi người dùng nhấn Enter trên trường nhập liệu repassword
    }
});

// Xử lý sự kiện khi người dùng nhấn nút Register
document.getElementById("register").addEventListener("click", function() {
    register(); // Gọi hàm xử lý đăng ký khi người dùng nhấn nút Register
});

// Hàm xử lý sự kiện khi Register
function register() {
    // Lấy giá trị từ các trường đầu vào
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const repassword = document.getElementById("repassword").value;
    const securityQuestion = document.getElementById("security-question").value; // Lấy giá trị của câu hỏi bảo mật
    const securityAnswer = document.getElementById("security-answer").value.trim(); // Lấy giá trị của câu trả lời

    // Kiểm tra xem các trường đầu vào có hợp lệ không
    if (username === '' || email === '' || password === '' || repassword === '' || securityAnswer === '') {
        alert("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    // Kiểm tra xác nhận mật khẩu
    if (password !== repassword) {
        alert("Mật khẩu không khớp. Vui lòng kiểm tra lại.");
        return;
    }

    // Kiểm tra định dạng email
    const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailFormat.test(email)) {
        alert("Email không đúng định dạng.");
        return;
    }

    // Kiểm tra mật khẩu có đủ 8 ký tự
    if (password.length < 8) {
        alert("Mật khẩu phải có ít nhất 8 ký tự.");
        return;
    }
    
    // Kiểm tra mật khẩu có đủ các điều kiện
    const passwordFormat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordFormat.test(password)) {
        alert("Mật khẩu phải chứa ít nhất một ký tự viết hoa, một ký tự viết thường, một số và một ký tự đặc biệt.");
        return;
    }

    // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu hay chưa
    const userRef = ref(db, 'user');
    get(userRef)
    .then((snapshot) => {
        let isUsernameExist = false;
        let isEmailExist = false;

        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData.email === email) {
                // Nếu email đã tồn tại, thông báo cho người dùng và không thực hiện đăng ký
                isEmailExist = true;
                alert("Email đã tồn tại. Vui lòng sử dụng email khác.");
                return;
            }
            if (userData.username === username) {
                // Nếu username đã tồn tại, thông báo cho người dùng và không thực hiện đăng ký
                isUsernameExist = true;
                alert("Username đã tồn tại. Vui lòng chọn username khác.");
                return;
            }
        });

        // Nếu cả email và username không tồn tại, tiến hành đăng ký người dùng mới
        if (!isEmailExist && !isUsernameExist) {
            createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Lấy UID của người dùng mới đăng ký
                const uid = userCredential.user.uid;

                // Lưu UID của người dùng trong trường dữ liệu 'uid' của node người dùng
                set(ref(db, 'user/' + username), {
                    username: username,
                    email: email,
                    password: password,
                    securityQuestion: securityQuestion,
                    securityAnswer: securityAnswer,
                    uid: uid // Lưu UID vào node người dùng
                }).then(() => {
                    alert("Đăng ký thành công!");
                    // Chuyển hướng người dùng đến trang login.html sau khi đăng ký thành công
                    window.location.href = "../index.html";
                }).catch((error) => {
                    console.error("Lỗi khi lưu dữ liệu:", error);
                    alert("Đã xảy ra lỗi. Vui lòng thử lại sau.");
                });
            })
            .catch((error) => {
                console.error("Lỗi khi đăng ký:", error);
                alert("Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.");
            });
        }
    })
    .catch((error) => {
        console.error("Lỗi khi kiểm tra email:", error);
        alert("Đã xảy ra lỗi khi kiểm tra email. Vui lòng thử lại sau.");
    });
};

// Xử lý sự kiện khi người dùng nhấn nút login
document.getElementById("submitPage").addEventListener("click", function() {
    // Làm cho transition hiển thị trước khi chuyển hướng
    const transition_el = document.querySelector('.transition');
    transition_el.classList.add('is-active');
    
    // Chờ một khoảng thời gian trước khi chuyển hướng
    setTimeout(() => {
        // Chuyển hướng người dùng đến trang register.html
        window.location.href = "../index.html";
    }, 500); // Chờ 0.5 giây trước khi chuyển hướng
});
