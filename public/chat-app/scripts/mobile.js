// Biến trạng thái cho thanh bên
var sidebarOpen = false;

document.getElementById('FLAMETALK-image').onclick = function() {
    if (window.innerWidth <= 768) { // Kiểm tra độ rộng của cửa sổ trình duyệt
        var sidebar = document.getElementById('sidebar-container');
        var chatWindow = document.getElementById('chatwindow-container');
        if (!sidebarOpen) {
            sidebar.style.width = '100%';
            sidebar.style.padding = '20px';
            chatWindow.style.width = '0%';
            sidebarOpen = true; // Cập nhật trạng thái của thanh bên
        } else {
            sidebar.style.width = '0%';
            sidebar.style.padding = '0';
            chatWindow.style.width = '100%';
            sidebarOpen = false; // Cập nhật trạng thái của thanh bên
        }
    }
};

document.getElementById('FLAMETALK-image2').onclick = function() {
    if (window.innerWidth <= 768) { // Kiểm tra độ rộng của cửa sổ trình duyệt
        var sidebar = document.getElementById('sidebar-container');
        var chatWindow = document.getElementById('chatwindow-container');
        if (sidebarOpen) {
            sidebar.style.width = '0%';
            sidebar.style.padding = '0';
            chatWindow.style.width = '100%';
            sidebarOpen = false; // Cập nhật trạng thái của thanh bên
        }
    }
};
