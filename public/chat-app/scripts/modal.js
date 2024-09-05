function openChangePasswordModal() {
    // Gọi hàm để đóng modal avatarModal nếu cần
    closeModal("avatarModal");
    // Gọi hàm để mở modal changePasswordModal
    openModal("changePasswordModal");
    return false; // Ngăn chặn reload trang
}

function openModal() {
    // Get the change password modal element
    const changePasswordModal = document.getElementById("changePasswordModal");
    // Set the display style to "block" to make the modal visible
    changePasswordModal.style.display = "block";
}

// Function to close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}


