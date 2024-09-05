// Import các hàm cần thiết từ Firebase SDK
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { app } from "./firebase-config.js";

// Lấy tham chiếu đến dịch vụ cơ sở dữ liệu Firebase
const db = getDatabase(app);

// Lấy tham chiếu đến dịch vụ xác thực Firebase
const auth = getAuth(app);
let currentUser = null; // Khởi tạo biến currentUser

// Tạo provider cho việc đăng nhập bằng Google và Facebook
const googleProvider = new GoogleAuthProvider();

//Kiểm tra xem người dùng đã đăng nhập hay chưa
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Kiểm tra xem trang hiện tại có phải là trang register.html không
        if (document.referrer.includes("chat-app/register.html")) {
            // Nếu trang hiện tại là trang register.html, không thực hiện đăng nhập
            return;
        }
        // Nếu đã đăng nhập và không phải từ trang register.html, chuyển hướng đến trang chat.html hoặc display.html
        window.location.href = "chat-app/display.html";
        currentUser = user; // Cập nhật currentUser
    }
});

// Xử lý sự kiện khi người dùng nhấn phím Enter trên trường nhập liệu username và password
document.getElementById("username").addEventListener('keypress', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById("password").focus(); // Di chuyển trỏ chuột đến trường nhập liệu password
    }
});

document.getElementById("password").addEventListener('keypress', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        login(); // Gọi hàm xử lý đăng nhập khi người dùng nhấn Enter trên trường nhập liệu password
    }
});

// Xử lý sự kiện khi người dùng nhấn nút đăng nhập
document.getElementById("submit").addEventListener('click', function(e){
    e.preventDefault();
    login(); // Gọi hàm xử lý đăng nhập khi người dùng nhấn nút submit
});

// Hàm xử lý sự kiện đăng nhập
function login(){

    // Lấy giá trị từ các trường đầu vào
    const userInput = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Kiểm tra xem các trường đầu vào có hợp lệ không
    if (userInput === '' || password === '') {
        alert("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    // Lấy dữ liệu của tất cả người dùng từ Realtime Database
    const usersRef = ref(db, 'user');
    get(usersRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                // Duyệt qua từng người dùng
                let foundUser = false; // Khởi tạo biến kiểm tra tìm thấy người dùng
                snapshot.forEach((childSnapshot) => {
                    const userData = childSnapshot.val();
                    // Kiểm tra xem người dùng có khớp với giá trị nhập vào không
                    if ((userData.email === userInput || userData.username === userInput) && userData.password === password) {
                        foundUser = true; // Đánh dấu đã tìm thấy người dùng
                        alert("Đăng nhập thành công!");
                        // Thực hiện xác thực bằng email và mật khẩu
                        signInWithEmailAndPassword(auth, userData.email || userData.username, password) // Sử dụng email hoặc usernname để đăng nhập
                            .then((userCredential) => {
                                const user = userCredential.user;
                                // Cập nhật currentUser
                                currentUser = user;
                                // Kiểm tra nếu tài khoản là admin hoặc email là admin@gmail.com
                                if (userInput === 'admin' || userData.email === 'admin@gmail.com') {
                                    // Chuyển hướng đến trang admin.html
                                    window.location.href = "admin.html";
                                } else {
                                    // Chuyển hướng đến trang display.html
                                    window.location.href = "chat-app/display.html";
                                }
                            })
                            .catch((error) => {
                                console.error("Lỗi khi đăng nhập:", error);
                                alert("Đã xảy ra lỗi. Vui lòng thử lại sau.");
                            });
                        return; // Thoát khỏi vòng lặp khi tìm thấy người dùng
                    }
                });
                // Nếu không tìm thấy người dùng, hiển thị thông báo tương ứng
                if (!foundUser) {
                    alert("Tên đăng nhập, email hoặc mật khẩu không chính xác.");
                }
            } else {
                // Nếu snapshot không tồn tại, hiển thị thông báo lỗi
                alert("Dữ liệu người dùng không tồn tại.");
            }
        })
        .catch((error) => {
            console.error("Lỗi khi đăng nhập:", error);
            alert("Đã xảy ra lỗi. Vui lòng thử lại sau.");
        });
};

// Xử lý sự kiện khi người dùng nhấn nút Register
document.getElementById("registerPage").addEventListener("click", function() {
    // Làm cho transition hiển thị trước khi chuyển hướng
    const transition_el = document.querySelector('.transition');
    transition_el.classList.add('is-active');
  
    // Chờ một khoảng thời gian trước khi chuyển hướng
    setTimeout(() => {
        // Chuyển hướng người dùng đến trang register.html
        window.location.href = "chat-app/register.html";
    }, 500); // Chờ 0.5 giây trước khi chuyển hướng
});

// Xử lý sự kiện khi người dùng nhấn nút đăng nhập bằng Google
document.getElementById("google-login").addEventListener("click", function() {
    signInWithPopup(auth, googleProvider)
    .then((result) => {
        alert("Welcome "+result.user.displayName);
        console.log(result.user);
        window.location.href = "chat-app/display.html";
    }).catch((error) => {
        console.error("Lỗi khi đăng nhập bằng Google:", error);
        alert("Đã xảy ra lỗi khi đăng nhập bằng Google. Vui lòng thử lại sau.");
    });                 
});
