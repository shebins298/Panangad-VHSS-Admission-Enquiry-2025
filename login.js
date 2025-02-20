document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("googleSignInBtn");
    const loadingIndicator = document.getElementById("loading");
    const message = document.getElementById("message");

    loginButton.style.display = "none";
    loadingIndicator.style.display = "block";


    loginButton.addEventListener("click", async function () {
        loginButton.style.display = "none";
        loadingIndicator.style.display = "block";
        message.innerText = "";

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;

            // ✅ Ensure user is added to Firestore before checking
            const userRef = db.collection("user").doc(user.uid);
            const doc = await userRef.get();

            if (!doc.exists) {
                await userRef.set({
                    email: user.email,
                    displayName: user.displayName,
                    admin: false,
                    status: "pending"
                });

                message.innerText = "Your login request is sent to admin.";
                loginButton.style.display = "none";
                await firebase.auth().signOut();
                return;
            }

            if (doc.data().admin === true) {
                window.location.href = "admin.html";
            } else {
                message.innerText = "Your login request is sent to admin.";
                loginButton.style.display = "none";
            }

        } catch (error) {
            console.error("Error during sign in:", error);
            message.innerText = "Error during sign in. Please try again.";
            loginButton.style.display = "block";
        } finally {
            loadingIndicator.style.display = "none";
        }
    });
});
