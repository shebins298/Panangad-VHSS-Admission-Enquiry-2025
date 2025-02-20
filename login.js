document.addEventListener("DOMContentLoaded", function () {
  const loginButton = document.getElementById("googleSignInBtn");
  const loadingIndicator = document.getElementById("loading");
  const message = document.getElementById("message");

  // Initially hide the login button and show a loading state
  loginButton.style.display = "none";
  loadingIndicator.style.display = "block";

  firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
      const userRef = db.collection("user").doc(user.uid);
      try {
        const doc = await userRef.get();
        if (doc.exists) {
          if (doc.data().admin === true) {
            window.location.href = "admin.html"; // Redirect admin users
          } else {
            message.innerText = "Waiting for admin approval. Contact admin if needed.";
            loginButton.style.display = "none"; // Hide login button since the user is already logged in
          }
        } else {
          // New users should not be logged out here
          message.innerText = "Your account is not registered. Try signing in again.";
          loginButton.style.display = "block";
          await firebase.auth().signOut(); // Log them out only if they are unregistered
        }
      } catch (error) {
        console.error("Error checking admin status on load:", error);
        loginButton.style.display = "block";
        loadingIndicator.style.display = "none";
      }
    } else {
      // No user logged in, show login button
      loginButton.style.display = "block";
      loadingIndicator.style.display = "none";
    }
  });

  // Google Sign-In
  loginButton.addEventListener("click", async function () {
    loginButton.style.display = "none";
    loadingIndicator.style.display = "block";
    message.innerText = "";

    const provider = new firebase.auth.GoogleAuthProvider();

    try {
      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      const userRef = db.collection("user").doc(user.uid);
      const doc = await userRef.get();

      if (doc.exists) {
        if (doc.data().admin === true) {
          window.location.href = "admin.html";
        } else {
          message.innerText = "Your login request is sent to admin.";
          loginButton.style.display = "none"; // Hide login button instead of signing out
        }
      } else {
        // Register new users in Firestore
        await userRef.set({
          email: user.email,
          displayName: user.displayName,
          admin: false,
          status: "pending"
        });
        message.innerText = "Your login request is sent to admin.";
        await firebase.auth().signOut(); // Log them out only after registration
        loginButton.style.display = "block";
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
