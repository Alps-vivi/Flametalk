function togglePasswordVisibility() {
    var passwordInput = document.getElementById("password");
    var icon = document.querySelector(".show-password-icon");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        passwordInput.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}

function toggleRePasswordVisibility() {
    var passwordInput = document.getElementById("repassword");
    var icon = document.querySelector("label[for='repassword'].show-password-icon");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        passwordInput.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}

function toggleOldPasswordVisibility() {
    var oldPasswordInput = document.getElementById("oldpassword");
    var icon = document.querySelector("label[for='oldpassword'].show-password-icon");

    if (oldPasswordInput.type === "password") {
        oldPasswordInput.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        oldPasswordInput.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}

function toggleNewPasswordVisibility() {
    var newPasswordInput = document.getElementById("newpassword");
    var icon = document.querySelector("label[for='newpassword'].show-password-icon");

    if (newPasswordInput.type === "password") {
        newPasswordInput.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        newPasswordInput.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}

function toggleReNewPasswordVisibility() {
    var renewPasswordInput = document.getElementById("renewpassword");
    var icon = document.querySelector("label[for='renewpassword'].show-password-icon");

    if (renewPasswordInput.type === "password") {
        renewPasswordInput.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        renewPasswordInput.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}
